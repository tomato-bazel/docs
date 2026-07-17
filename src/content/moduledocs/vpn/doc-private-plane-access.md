---
title: "private-plane-access"
module: "vpn"
---

## Private-plane access — WireGuard + the hermetic `wg-client`

Operator/CI access to a private VPC plane (the Kubernetes API, internal ALBs, in-VPC
services) over an OIDC-authed WireGuard tunnel — so the cluster's public Kubernetes
endpoint can be locked down (no laptop-IP allowlist churn).

```
laptop ── wg-client ──UDP/51820──▶ gateway ASG-of-1 (wg.example.com)
   │  (userspace boringtun+smoltcp)        │  peers reconciled from DynamoDB
   │                                        ▼
   └─ wg-client provision ──gRPC/TLS──▶ provisioner (Fargate, vpn.example.com:443)
        (OIDC PKCE bearer)                   │  OIDC-JWT authed; writes the peer row
                                             ▼
                                        private Kubernetes API + VPC services (10.0.0.0/16)
```

Two planes, one OIDC issuer:
- **Provisioner** (`deploy/wireguard-provisioner.yaml`) — the gRPC `WireguardAccess`
  service. The CLI authenticates (browser PKCE), sends only its public key, and gets back
  a tunnel config; the provisioner records the peer in DynamoDB
  (`deploy/wireguard-registry.yaml`).
- **Gateway** (`deploy/wireguard.yaml`) — the ASG-of-1 data plane. A reconciler picks up
  ACTIVE peer rows within ~1 min (`wg set`, peer-only — never resets the listen port).

Auth is generic OIDC: the provisioner validates the bearer JWT against an `OidcIssuer`'s
JWKS, and `wg-client` runs an OAuth Authorization-Code + PKCE flow against any hosted UI.
`deploy/vpn-auth.yaml` ships an AWS Cognito user pool as the **reference** identity
provider; bring your own by passing `OidcIssuer`/hosted-UI/client-id instead.

The break-glass alternative (no Rust client) is `tools/wireguard/setup-client.sh` +
`wg-quick`; this doc is the product path.

---

### 0. One-time: an OIDC client for the CLI

If you use the reference `deploy/vpn-auth.yaml`, it provisions a dedicated **public** app
client (`CliClient`, `GenerateSecret: false`, authorization_code + PKCE, loopback
callbacks) exported as `VpnCliClientId`. Deploy it once:

```sh
bazel run @vpn//deploy:vpn-auth.up -- --parameter-overrides \
  DomainPrefix=<globally-unique> AllowedEmailDomain=example.com \
  GoogleClientId=… GoogleClientSecret=…
```

PKCE/S256 needs no extra config — it's a request-time parameter the CLI supplies. With
your own OIDC provider, register a public client with the same loopback callback URLs
(`http://localhost:{8080,8081,8082,8765}/callback`) and skip this stack.

### 1. Build the client

```sh
bazel build @vpn//wg-client:wg-client
BIN=$(bazel cquery --output=files @vpn//wg-client:wg-client 2>/dev/null)
```

Pure-Rust + hermetic: boringtun (WireGuard) + smoltcp (userspace TCP/IP) for the data
path; rustls/ring + bundled webpki roots for the provisioner TLS. No `wg`/`wg-quick`, no
TUN device, no root for the userspace backend.

### 2. Configure from the identity-provider values

Using the reference `vpn-auth` stack's CloudFormation exports:

```sh
export AWS_DEFAULT_REGION=us-east-1
xport() { aws cloudformation list-exports \
  --query "Exports[?Name=='$1'].Value" --output text; }

export WG_CLIENT_HOSTED_UI=$(xport VpnHostedUiBaseUrl)
export WG_CLIENT_APP_ID=$(xport VpnCliClientId)
export WG_CLIENT_TOKEN_ENDPOINT=$(xport VpnTokenEndpoint)   # optional (derived otherwise)
```

(With your own OIDC provider, set `WG_CLIENT_HOSTED_UI` + `WG_CLIENT_APP_ID` directly. For
CI / a pre-minted token, set `WG_CLIENT_TOKEN` to skip the browser flow entirely.)

### 3. Provision the device

```sh
"$BIN" provision --addr https://vpn.example.com:443
```

Opens the browser → OIDC login → the CLI captures the code on a loopback listener,
exchanges it (PKCE), generates a WireGuard keypair locally, calls `ProvisionPeer` (sends
only the public key), and writes `~/.wg-client/config.json` (0600). The provisioner
records the peer; the gateway reconciler activates it within ~1 min.

### 4. Bring the tunnel up (userspace, no privileges)

The userspace backend forwards specific local ports through the tunnel — ideal for plain
TCP services on the private plane:

```sh
## e.g. an internal gRPC/HTTP service reachable at a VPC IP
"$BIN" up --backend userspace --forward 8080:10.0.12.34:80
```

`--forward localport:targetip:targetport` (v1 takes a literal **IP** target — in-tunnel
DNS is a later increment; resolve the host first). Multiple `--forward`s are allowed.

#### kubectl over the tunnel

The Kubernetes API is HTTPS on private ENIs. Two paths:

- **Userspace forward (works today, a little fiddly).** Forward to an API-server ENI IP
  and override the verification hostname so the cert's SAN still validates:
  ```sh
  # discover an API ENI private IP (managed ENIs in the cluster SGs)
  APIIP=$(aws ec2 describe-network-interfaces \
    --filters "Name=description,Values=Amazon EKS*" \
    --query 'NetworkInterfaces[0].PrivateIpAddresses[0].PrivateIpAddress' --output text)
  "$BIN" up --backend userspace --forward 6443:$APIIP:443 &

  # point kubeconfig at the forward, but verify against the real API hostname (a cert SAN)
  #   server: https://localhost:6443
  #   tls-server-name: <the original https://...eks.amazonaws.com host>
  #   certificate-authority-data: <unchanged>
  kubectl --server https://localhost:6443 \
    --tls-server-name "$(kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}' | sed 's#https://##')" \
    get nodes
  ```
- **Full-TUN backend (cleaner, later increment).** `--backend tun` (boringtun + an OS TUN
  device) routes the VPC CIDR transparently with VPC DNS, so the stock kubeconfig works
  unmodified. Needs elevated privileges; not yet wired (`tun_start` bails today).

---

### 5. (USER-GATED) Lock down the public cluster endpoint

**Only after** `kubectl get nodes` succeeds over the tunnel. This removes direct laptop-IP
access; re-enabling needs another deploy. In your cluster stack (e.g. the EKS
`ResourcesVpcConfig`):

```diff
       ResourcesVpcConfig:
         ...
-        EndpointPublicAccess: true
+        EndpointPublicAccess: false
         EndpointPrivateAccess: true
-        PublicAccessCidrs: !Ref EndpointPublicAccessCidrs
```

(Or keep public access but tighten `PublicAccessCidrs` to the gateway's egress — a softer
first step.) After the flip, **all** kubectl/helm to the cluster must go through the
tunnel (in-VPC CI runners are unaffected).

---

### Verification checkpoints

1. **Peer active:** after `provision`, the registry row is `ACTIVE` and the gateway has
   the peer — `aws dynamodb get-item` on `WireguardPeerTableName`, and the box's
   `wg show` lists the public key (within ~1 min of provisioning).
2. **Handshake:** `wg-client up` proactively sends a handshake init; the first forwarded
   connection (or the periodic keepalive) completes it. No traffic flows until the
   handshake lands — check the gateway's `wg show` `latest handshake`.
3. **Token shape:** the provisioner's `JwtAuthInterceptor` validates the **access token**
   (`token_use=access`, owner = `sub`) off `OidcIssuer`. The CLI returns the `access_token`
   from the code exchange. If the provisioner is found to require the `id_token`/`aud`
   instead, that's a one-line provisioner-side change — surface it here.
4. **Split tunnel:** only the VPC CIDR(s) route through the gateway; normal internet stays
   on the local link (the gateway peer's `AllowedIPs`, and the userspace forwards are
   per-port anyway).
