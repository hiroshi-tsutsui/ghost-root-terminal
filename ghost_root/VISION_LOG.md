[2026-02-11 23:55]
> CHANGES: ghost_root/web/lib/Shell.ts
> PUZZLE ADDED: "The SSL Handshake" (OpenSSL / Certificate Expiry).
> MECHANICS: Added `openssl` command (`req`, `x509`). Updated `sat connect` to enforce SSL.
> LORE: The OMEGA satellite uplink is down due to a Y2K-era expired certificate.
> SOLUTION: `openssl req -new -key /etc/ssl/private/satellite.key -out server.csr` -> `openssl x509 -req -in server.csr -signkey /etc/ssl/private/satellite.key -out /etc/ssl/certs/satellite.crt`.
