import random

def gen_log():
    lines = []
    ips = ["192.168.1.5", "10.0.0.1", "172.16.0.1", "8.8.8.8", "1.1.1.1"]
    
    for i in range(1000):
        ip = random.choice(ips)
        port = random.randint(1024, 65535)
        status = random.choice(["ALLOWED", "DENIED", "DROPPED"])
        lines.append(f"Feb 16 {random.randint(0,23):02}:{random.randint(0,59):02}:{random.randint(0,59):02} ghost-root kernel: [UFW {status}] IN=eth0 OUT= MAC=00:11:22:33:44:55 SRC={ip} DST=192.168.1.105 LEN=60 TOS=0x00 PREC=0x00 TTL=64 ID={random.randint(0,65535)} PROTO=TCP SPT={port} DPT=22 WINDOW=512 RES=0x00 SYN URGP=0")

    # The Needle
    needle = "Feb 16 14:02:42 ghost-root kernel: [UFW BLOCK] IN=eth0 OUT= MAC=00:11:22:33:44:55 SRC=10.10.10.222 DST=192.168.1.105 LEN=60 TOS=0x00 PREC=0x00 TTL=64 ID=1337 PROTO=TCP SPT=6666 DPT=22 WINDOW=512 RES=0x00 SYN URGP=0 [SUSPICIOUS]"
    lines.insert(random.randint(500, 900), needle)
    
    return "\\n".join(lines)

print(gen_log())
