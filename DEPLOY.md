# Deploy Comic Store lên VPS

Hướng dẫn triển khai Comic Store lên VPS bằng Docker + Nginx Proxy Manager, viết chi tiết
từng lệnh — kể cả bạn chưa từng làm sysadmin cũng làm theo được. Áp dụng cho VPS Ubuntu
22.04/24.04.

> Máy dev local **không cần Docker**, không đổi gì cả — vẫn dùng MySQL cài trực tiếp +
> HeidiSQL như đang làm (xem README.md). Toàn bộ nội dung dưới đây chỉ áp dụng cho VPS.

## Mục lục

- [0. Khái niệm cơ bản](#0-khái-niệm-cơ-bản)
- [1. Trước khi bắt đầu](#1-trước-khi-bắt-đầu)
- [2. Trỏ DNS về VPS](#2-trỏ-dns-về-vps)
- [3. SSH vào VPS lần đầu + bảo mật cơ bản](#3-ssh-vào-vps-lần-đầu--bảo-mật-cơ-bản)
- [4. Cài Docker](#4-cài-docker)
- [5. Nginx Proxy Manager](#5-nginx-proxy-manager-reverse-proxy-dùng-chung)
- [6. Deploy Comic Store (lần đầu)](#6-deploy-comic-store-lần-đầu)
- [7. Tạo Proxy Host + SSL](#7-tạo-proxy-host--ssl-trong-nginx-proxy-manager)
- [8. Kiểm tra sau deploy](#8-kiểm-tra-sau-deploy)
- [9. Deploy các lần sau](#9-deploy-các-lần-sau-cập-nhật-code)
- [10. Backup / restore database](#10-backup--restore-database)
- [11. Thêm project thứ 2 trên cùng VPS](#11-thêm-project-thứ-2-trên-cùng-vps)
- [12. Bảng lệnh tra cứu nhanh](#12-bảng-lệnh-tra-cứu-nhanh)

---

## 0. Khái niệm cơ bản

Đọc phần này trước nếu chưa quen — mỗi bước sau đều dựa vào các khái niệm này.

- **VPS**: một máy tính Linux thuê từ xa, có địa chỉ IP riêng, bạn có toàn quyền (root) như
  ngồi trước máy đó. Khác Shared Hosting ở chỗ không có cPanel/giao diện sẵn — mọi thứ làm
  qua dòng lệnh (trừ khi tự cài thêm giao diện quản lý).
- **SSH**: cách bạn "kết nối từ xa" vào VPS để gõ lệnh, giống Remote Desktop nhưng chỉ có
  terminal chữ, không có màn hình đồ hoạ.
- **Domain & DNS**: domain (`yourdomain.com`) là cái tên; DNS là "danh bạ điện thoại" ánh xạ
  tên đó sang IP VPS. Sau khi sửa DNS phải đợi nó **lan truyền** (propagate) đi khắp nơi
  trên mạng — có thể vài phút, có thể vài giờ.
- **Docker / container**: đóng gói app cùng mọi thứ nó cần (đúng version Node, thư viện hệ
  thống...) thành một "hộp" chạy độc lập, không phụ thuộc phần mềm cài sẵn trên VPS. Nhờ vậy
  nhiều project khác nhau, cần version Node/MySQL khác nhau, có thể chạy chung 1 VPS mà
  không đụng nhau.
- **Docker Compose**: công cụ mô tả nhiều container (mysql, backend, frontend) trong 1 file
  `.yml`, rồi khởi động/tắt tất cả bằng 1 lệnh thay vì gõ `docker run` nhiều lần.
- **Reverse proxy (Nginx Proxy Manager)**: một "lễ tân" đứng giữa internet và các container.
  Request tới `yourdomain.com` hay `api.yourdomain.com` đều gõ cửa lễ tân này trước, lễ tân
  đọc domain rồi chuyển tiếp (forward) vào đúng container, đồng thời lo luôn HTTPS/SSL.

### Cách dùng `nano` (trình soạn thảo trong terminal)

Hướng dẫn dưới có vài chỗ bảo mở file bằng `nano <tên file>` để sửa nội dung. Cách dùng:

- Di chuyển bằng phím mũi tên, gõ trực tiếp để sửa như Notepad.
- Lưu lại: `Ctrl+O` → nhấn `Enter` để xác nhận tên file.
- Thoát: `Ctrl+X`.

---

## 1. Trước khi bắt đầu

Cần có sẵn 4 thứ:

1. **IP của VPS** — nhà cung cấp gửi qua email lúc mua, hoặc xem trong control panel của họ
   (Vultr, DigitalOcean, Contabo, iZ, TinoHost...).
2. **Thông tin SSH** — thường là user `root` + mật khẩu (gửi kèm email), hoặc SSH key nếu
   bạn chọn kiểu đó lúc tạo VPS.
3. **Domain đã mua** + quyền vào trang quản lý DNS của domain đó (nơi bạn mua domain —
   Namecheap, GoDaddy, Mắt Bão, Nhân Hòa, PA Vietnam, Cloudflare...).
4. **Repo Comic Store đã push lên GitHub/GitLab.** Nếu repo **private**, chuẩn bị sẵn 1 trong 2:
   - Personal Access Token (PAT) — dùng như mật khẩu khi `git clone` hỏi.
   - SSH deploy key — an toàn hơn, hướng dẫn tạo ở [Phase 6](#6-deploy-comic-store-lần-đầu).

---

## 2. Trỏ DNS về VPS

Vào trang quản lý DNS của domain, thêm 2 bản ghi **A** trỏ về IP VPS (thay `yourdomain.com`
bằng domain thật, thay `VPS_IP` bằng IP thật):

| Loại | Host/Name | Value/Points to | Ý nghĩa |
| --- | --- | --- | --- |
| A | `@` | `VPS_IP` | `yourdomain.com` → frontend |
| A | `api` | `VPS_IP` | `api.yourdomain.com` → backend |

Giao diện mỗi nhà cung cấp domain khác nhau nhưng đều có mục **DNS / DNS Records / Zone
Editor**. Trường "Host"/"Name" nhập `@` (nghĩa là chính domain gốc) hoặc `api` (thành
subdomain), trường "Value"/"Points to"/"Content" nhập IP VPS. TTL để mặc định là được.

**Kiểm tra đã lan truyền chưa** (chạy trên máy bạn, PowerShell cũng được):

```bash
nslookup yourdomain.com
```

Kỳ vọng thấy dòng `Address:` là đúng IP VPS. Nếu ra IP khác hoặc báo không tìm thấy — DNS
chưa kịp lan truyền, đợi thêm (kiểm tra thêm ở [whatsmydns.net](https://www.whatsmydns.net)
để xem trạng thái nhiều nơi trên thế giới cùng lúc). Có thể làm tiếp Phase 3–6 song song
trong lúc chờ DNS, chỉ cần DNS trỏ đúng **trước** khi tới bước xin SSL ở Phase 7.

> **Nếu domain đang dùng Cloudflare**: khi thêm bản ghi A, đám mây cạnh bản ghi phải để
> **xám (DNS only)**, không để **cam (Proxied)** — nếu để cam, Nginx Proxy Manager sẽ không
> xin được SSL vì Cloudflare đứng chặn ở giữa. Có thể bật cam lại sau khi đã có SSL nếu muốn
> dùng CDN của Cloudflare (nằm ngoài phạm vi hướng dẫn này).

---

## 3. SSH vào VPS lần đầu + bảo mật cơ bản

Từ máy bạn (PowerShell):

```bash
ssh root@VPS_IP
```

- **Lệnh này làm gì**: mở kết nối terminal từ xa tới VPS bằng user `root`.
- **Kỳ vọng thấy gì**: lần đầu sẽ hỏi
  `Are you sure you want to continue connecting (yes/no/[fingerprint])?` → gõ `yes` rồi
  Enter. Sau đó hỏi mật khẩu (`root@VPS_IP's password:`) — gõ mật khẩu (màn hình sẽ **không**
  hiện ký tự nào khi gõ, đây là bình thường, không phải bị treo) rồi Enter.
- **Nếu lỗi**:
  - `Connection timed out` — sai IP, hoặc firewall của nhà cung cấp VPS (không phải `ufw`,
    mà là "Security Group"/"Firewall" ở control panel của họ) đang chặn cổng 22. Vào control
    panel VPS kiểm tra mục Firewall/Network.
  - `Permission denied (publickey)` — VPS được cấu hình chỉ cho login bằng SSH key, không
    cho password. Xem lại email lúc tạo VPS có key riêng không, hoặc dùng tính năng
    "Console"/"VNC" ngay trên control panel của nhà cung cấp để vào máy trực tiếp.
  - `Permission denied, please try again` — gõ sai mật khẩu, thử lại (chú ý bàn phím gõ
    không hiện ký tự là bình thường).

Sau khi vào được, cập nhật hệ thống:

```bash
apt update && apt upgrade -y
```

- **`apt update`**: tải danh sách phiên bản gói phần mềm mới nhất từ server Ubuntu (chưa cài
  gì cả, chỉ cập nhật danh sách).
- **`apt upgrade -y`**: nâng cấp mọi gói đã cài lên bản mới nhất theo danh sách vừa tải, vá
  các lỗi bảo mật. `-y` = tự động trả lời "yes" cho mọi câu hỏi xác nhận.
- **Kỳ vọng**: chạy xong quay lại được dấu nhắc lệnh (`root@...:~#`), có thể mất 1–3 phút.
  Nếu có dòng hỏi `Restart services during package upgrades without asking?` → chọn `Yes`
  (Tab để chọn, Enter để xác nhận).

Tạo user thường thay vì dùng `root` cho công việc hằng ngày (an toàn hơn — lỡ gõ nhầm lệnh
nguy hiểm cũng không phá được toàn hệ thống):

```bash
adduser deploy
```

- **Kỳ vọng**: hỏi đặt mật khẩu mới (gõ 2 lần để xác nhận), rồi hỏi Full Name/Room
  Number/Work Phone... — **Enter bỏ qua hết**, chỉ mật khẩu là bắt buộc. Cuối cùng hỏi
  `Is the information correct? [Y/n]` → gõ `Y`.

```bash
usermod -aG sudo deploy
```

- **Lệnh này làm gì**: thêm user `deploy` vào group `sudo`, để sau này gõ `sudo <lệnh>` thì
  lệnh đó chạy với quyền root — không cần login thẳng bằng root mọi lúc.

Bật firewall — **làm đúng thứ tự dưới đây, sai thứ tự sẽ tự khoá luôn SSH của chính mình**:

```bash
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw allow 81
ufw enable
```

- **`ufw allow OpenSSH`**: mở cổng 22 (SSH) — **bắt buộc phải chạy dòng này trước khi
  `enable`**, nếu quên, bật firewall xong bạn sẽ mất kết nối SSH vĩnh viễn và phải nhờ nhà
  cung cấp VPS mở "Console cứu hộ" để vào gỡ.
- **`ufw allow 80` / `443`**: mở cổng web thường (HTTP) và web bảo mật (HTTPS) — nơi Nginx
  Proxy Manager sẽ lắng nghe.
- **`ufw allow 81`**: mở cổng giao diện quản trị của Nginx Proxy Manager (dùng ở Phase 5).
  Ở cuối Phase 5 có bước khuyến nghị thu hẹp lại cổng này, không để mở public mãi mãi.
- **`ufw enable`**: kỳ vọng hỏi
  `Command may disrupt existing ssh connections. Proceed with operation (y|n)?` → gõ `y`.

Kiểm tra lại:

```bash
ufw status
```

Kỳ vọng thấy `Status: active` và danh sách `22`, `80`, `443`, `81` đều `ALLOW`.

Đăng xuất khỏi root, SSH lại bằng user `deploy` — từ đây về sau **dùng user `deploy` cho mọi
lệnh còn lại** trong hướng dẫn này:

```bash
exit
```

```bash
ssh deploy@VPS_IP
```

---

## 4. Cài Docker

Vẫn đang là user `deploy`:

```bash
curl -fsSL https://get.docker.com | sudo sh
```

- **Lệnh này làm gì**: `curl` tải script cài đặt Docker chính thức từ `get.docker.com`, rồi
  `| sudo sh` chạy ngay script đó với quyền root. Script tự nhận diện đây là Ubuntu và cài
  Docker Engine + Docker Compose plugin đúng cách.
- **Kỳ vọng**: chạy khoảng 1–2 phút, nhiều dòng log cài đặt, kết thúc bằng vài dòng hướng dẫn
  của Docker (có thể bỏ qua). Không thấy dòng nào chứa `ERROR`.
- **Nếu lỗi**:
  - `curl: command not found` — VPS thiếu curl, chạy `sudo apt install -y curl` rồi thử lại.
  - `Could not resolve host` — VPS chưa có kết nối internet ra ngoài hoặc DNS của chính VPS
    có vấn đề, hiếm gặp, thử `ping -c3 8.8.8.8` để kiểm tra kết nối mạng của VPS trước.

```bash
sudo usermod -aG docker $USER
```

- **Lệnh này làm gì**: thêm user hiện tại (`deploy`) vào group `docker`, để chạy `docker ...`
  không cần gõ `sudo` trước mỗi lần.
- **Quan trọng**: thay đổi group chỉ có hiệu lực ở phiên đăng nhập **mới**. Thoát và SSH lại:

```bash
exit
```

```bash
ssh deploy@VPS_IP
```

Kiểm tra Docker hoạt động:

```bash
docker run hello-world
```

- **Kỳ vọng**: tải một image nhỏ về và in ra đoạn text bắt đầu bằng
  `Hello from Docker!` — nghĩa là cài thành công.
- **Nếu lỗi**: `permission denied while trying to connect to the Docker daemon socket` —
  chưa thoát/đăng nhập lại sau lệnh `usermod` ở trên (group chưa được nạp). Chạy tạm
  `newgrp docker` để có hiệu lực ngay không cần logout, hoặc đăng xuất/đăng nhập lại.

```bash
docker compose version
```

Kỳ vọng in ra số phiên bản (ví dụ `Docker Compose version v2.x.x`) — xác nhận Compose plugin
đã có sẵn, không cần cài riêng.

---

## 5. Nginx Proxy Manager (reverse proxy dùng chung)

Chỉ dựng **một lần duy nhất** cho cả VPS — đứng trước mọi project sau này, không riêng Comic
Store.

```bash
docker network create proxy
```

- **Lệnh này làm gì**: tạo một mạng ảo Docker tên `proxy`. Bất kỳ container nào (dù thuộc
  compose file khác nhau, thư mục khác nhau) join vào mạng này đều gọi được nhau qua **tên
  container** thay vì phải biết IP nội bộ — đây là cách Nginx Proxy Manager "thấy" được
  frontend/backend của Comic Store.
- **Nếu lỗi** `network with name proxy already exists` — không sao, nghĩa là đã tạo trước
  đó rồi (ví dụ chạy lại hướng dẫn), bỏ qua và làm tiếp.

Tạo thư mục hạ tầng dùng chung, tách biệt khỏi mọi project:

```bash
mkdir -p ~/infra/nginx-proxy-manager
cd ~/infra/nginx-proxy-manager
```

Tạo file `docker-compose.yml` bằng lệnh sau (dán nguyên khối, kể cả dòng `cat` và `EOF`):

```bash
cat > docker-compose.yml <<'EOF'
services:
  npm:
    image: jc21/nginx-proxy-manager:latest
    container_name: nginx_proxy_manager
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
      - "81:81"
    volumes:
      - ./data:/data
      - ./letsencrypt:/etc/letsencrypt
    networks:
      - proxy

networks:
  proxy:
    external: true
EOF
```

- **Lệnh này làm gì**: `cat > file <<'EOF' ... EOF` là cách ghi nội dung nhiều dòng vào 1
  file trực tiếp từ terminal, không cần mở trình soạn thảo. Mọi thứ giữa 2 dòng `EOF` được
  ghi y nguyên vào `docker-compose.yml`.
- **`ports: "80:80"` v.v.**: mở cổng 80/443/81 của chính VPS, chuyển thẳng vào container NPM
  — đây là container **duy nhất** trong toàn bộ hướng dẫn này mở cổng ra ngoài host, vì nó
  đóng vai trò lễ tân nhận request từ internet.
- **`networks: proxy: external: true`**: bảo Compose "dùng mạng `proxy` đã có sẵn", không tự
  tạo mạng mới.

Khởi động:

```bash
docker compose up -d
```

- **Lệnh này làm gì**: tải image `jc21/nginx-proxy-manager` (lần đầu mất khoảng 1 phút) rồi
  khởi động container ở chế độ nền (`-d` = detached, không chiếm terminal).
- **Kỳ vọng**: dòng cuối có dạng `✔ Container nginx_proxy_manager  Started`.
- **Nếu lỗi** `Bind for 0.0.0.0:80 failed: port is already allocated` — VPS đã có sẵn
  Apache/Nginx chiếm cổng 80 (một số nhà cung cấp cài sẵn). Kiểm tra và tắt nó:
  ```bash
  sudo systemctl stop nginx apache2 2>/dev/null
  sudo systemctl disable nginx apache2 2>/dev/null
  ```
  rồi chạy lại `docker compose up -d`.

Truy cập `http://VPS_IP:81` bằng trình duyệt trên máy bạn.

- **Nếu không vào được trang**: kiểm tra lại `ufw status` trên VPS đã `ALLOW` cổng 81 chưa
  (Phase 3); kiểm tra thêm firewall riêng của nhà cung cấp VPS ở control panel (một số VPS
  như Vultr/AWS/GCP có "Security Group" tách biệt với `ufw`, phải mở cổng 81/80/443 ở đó
  nữa).

Đăng nhập bằng tài khoản mặc định:

```
Email:    admin@example.com
Password: changeme
```

**Đổi email + mật khẩu ngay** ở màn hình hiện ra sau khi đăng nhập lần đầu — đây là thông
tin đăng nhập public ai cũng biết nếu tìm trên mạng.

> **Khuyến nghị bảo mật** (làm sau khi đã xong toàn bộ hướng dẫn, không bắt buộc ngay): thu
> hẹp cổng 81 chỉ cho IP của bạn thay vì mở cho cả internet.
> ```bash
> # chạy lệnh dưới TRÊN MÁY BẠN (không phải VPS) để xem IP public hiện tại
> curl ifconfig.me
> ```
> ```bash
> # chạy TRÊN VPS, thay YOUR_IP bằng kết quả trên
> sudo ufw allow from YOUR_IP to any port 81 proto tcp
> sudo ufw delete allow 81
> ```
> Nếu IP nhà/mạng bạn hay đổi (mạng 4G, một số ISP Việt Nam cấp IP động), làm bước này sẽ
> tự khoá bạn ra khỏi trang quản trị — có thể bỏ qua bước này nếu không chắc IP mình cố định.

---

## 6. Deploy Comic Store (lần đầu)

### Clone repo

Nếu **repo public**:

```bash
cd ~
git clone <url-repo-cua-ban> comic-store
cd comic-store
```

Nếu **repo private**, chọn 1 trong 2 cách:

**Cách A — Personal Access Token (đơn giản hơn)**: tạo token trên GitHub tại
`Settings → Developer settings → Personal access tokens → Generate new token` (quyền `repo`
là đủ). Khi `git clone https://github.com/...` hỏi username/password, nhập username GitHub
và **dán token vào ô password** (GitHub không còn nhận mật khẩu thường cho git từ 2021).

**Cách B — SSH deploy key (an toàn hơn, không cần nhớ token)**:

```bash
ssh-keygen -t ed25519 -C "vps-deploy" -f ~/.ssh/id_ed25519 -N ""
cat ~/.ssh/id_ed25519.pub
```

- **`ssh-keygen ...`**: tạo cặp khoá SSH mới, `-N ""` nghĩa là không đặt passphrase (để
  script tự động chạy được sau này không cần nhập tay).
- **`cat ...pub`**: in ra khoá **công khai** — copy toàn bộ dòng này.

Vào GitHub repo → `Settings → Deploy keys → Add deploy key`, dán khoá public vừa copy, không
cần tick "Allow write access" (chỉ đọc là đủ để clone/pull). Sau đó:

```bash
cd ~
git clone git@github.com:tai-khoan/comic-store.git comic-store
cd comic-store
```

### Tạo file env production

Có 2 file `.env` cần tạo trên VPS — **không commit vào git**, đã có sẵn trong `.gitignore`:

```bash
cp .env.production.example .env
nano .env
```

Điền giá trị thật (xem lại [Cách dùng nano](#cách-dùng-nano-trình-soạn-thảo-trong-terminal)
ở trên nếu quên thao tác):

```dotenv
MYSQL_ROOT_PASSWORD=<đặt mật khẩu mạnh, không dấu cách, không ký tự $ ` " \>
MYSQL_DATABASE=comic_store
MYSQL_USER=comic_user
MYSQL_PASSWORD=<đặt mật khẩu mạnh khác, cùng lưu ý ký tự>
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```

> Tránh các ký tự `$ " ' \` trong mật khẩu — chúng có ý nghĩa đặc biệt trong file `.env` và
> câu lệnh shell, dễ gây lỗi khó hiểu. Chữ + số + vài ký tự `_ - . @` là an toàn nhất.

```bash
cp backend/.env.example backend/.env
nano backend/.env
```

```dotenv
PORT=3002
DATABASE_URL="mysql://comic_user:<đúng mật khẩu MYSQL_PASSWORD ở trên>@mysql:3306/comic_store"
FRONTEND_URL="https://yourdomain.com"
NODE_ENV=production
```

- **`mysql:3306` chứ không phải `localhost:3306`**: `mysql` ở đây là **tên service** trong
  `docker-compose.prod.yml`, không phải địa chỉ máy chủ thật. Bên trong mạng Docker nội bộ,
  các container gọi nhau bằng tên service giống như tên miền riêng.
- **`NODE_ENV=production`**: bắt buộc — thiếu biến này, cookie đăng nhập sẽ không bật cờ
  `secure`, kém an toàn hơn khi chạy qua domain thật (xem
  `backend/src/auth/auth.controller.ts:40`).
- **`FRONTEND_URL` phải khớp chính xác** origin trình duyệt sẽ dùng, kể cả `https://`, không
  có dấu `/` ở cuối — sai chỗ này là nguyên nhân phổ biến nhất của lỗi CORS ở Phase 8.

### Build và chạy

```bash
docker compose -f docker-compose.prod.yml build
```

- **Lệnh này làm gì**: đọc `backend/Dockerfile` và `frontend/Dockerfile`, build thành 2
  Docker image (đóng gói toàn bộ code + Node + dependencies). Lần đầu tải base image
  (`node:20-slim`, `node:20-alpine`) và cài `npm ci` từ đầu nên có thể mất **5–10 phút**.
- **Kỳ vọng**: kết thúc bằng vài dòng `=> => naming to docker.io/library/comic-store-backend`
  và `...-frontend`, không có dòng nào bắt đầu bằng `ERROR` hay `failed to solve`.
- **Nếu lỗi**:
  - `npm ci` báo lỗi liên quan `package-lock.json` (ví dụ `npm ci can only install packages
    when your package.json and package-lock.json are in sync`) — lockfile trên VPS (từ git)
    không khớp code. Trên máy dev, chạy `npm install` trong thư mục lỗi (`backend` hoặc
    `frontend`), commit `package-lock.json` mới, push, rồi `git pull` lại trên VPS và build
    lại.
  - Lỗi biên dịch TypeScript (`error TS...`) — code đang lỗi build thật sự, không liên quan
    Docker. Chạy `npm run build` trong thư mục `backend`/`frontend` trên máy dev để tái hiện
    và sửa lỗi trước, rồi push lại.
  - `no space left on device` — VPS hết dung lượng đĩa (thường gặp ở VPS cấu hình thấp).
    Kiểm tra `df -h`, nếu `/` gần đầy, dọn image/cache Docker cũ không dùng:
    ```bash
    docker system prune -a
    ```
    (lệnh này hỏi xác nhận `y/N`, xoá mọi image/container/cache không đang chạy — an toàn
    với setup hiện tại vì chỉ có các container của bạn).
  - `no configuration file provided: not found` — đang không đứng trong thư mục
    `~/comic-store` (thư mục chứa `docker-compose.prod.yml`). Chạy `cd ~/comic-store` rồi
    thử lại.

```bash
docker compose -f docker-compose.prod.yml up -d
```

- **Lệnh này làm gì**: tạo và khởi động 3 container (`mysql`, `backend`, `frontend`) ở chế
  độ nền, theo đúng thứ tự phụ thuộc (`backend` đợi `mysql` khoẻ mạnh mới chạy, nhờ
  `depends_on: condition: service_healthy` trong compose file).

```bash
docker compose -f docker-compose.prod.yml ps
```

- **Kỳ vọng**: cột `STATUS` của `comic_store_mysql` hiện `Up ... (healthy)`, của
  `comic_store_backend` và `comic_store_frontend` hiện `Up ...`.
- **Nếu lỗi**:
  - Một container hiện `Restarting (1) ...` liên tục — container bị crash ngay sau khi
    khởi động, xem log để biết lý do cụ thể (bước ngay dưới đây).
  - `comic_store_mysql` mãi không chuyển sang `(healthy)` — MySQL khởi tạo lần đầu (nạp
    `docker/mysql/init/schema.sql`) có thể mất khoảng 30–60 giây, đợi thêm rồi `ps` lại. Nếu
    sau vài phút vẫn không healthy, xem log mysql.

Xem log để chẩn đoán khi có lỗi (`Ctrl+C` để thoát xem log, container vẫn chạy bình thường):

```bash
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f mysql
```

Vài lỗi log thường gặp và cách xử lý:

| Log thấy được | Nguyên nhân | Cách xử lý |
| --- | --- | --- |
| `Error: connect ECONNREFUSED mysql:3306` (backend) | `DATABASE_URL` sai, hoặc mysql chưa kịp sẵn sàng | So khớp `MYSQL_PASSWORD` trong `.env` (root) với mật khẩu trong `backend/.env`; đợi thêm nếu mysql chưa healthy |
| `Access denied for user 'comic_user'@'%'` (backend/mysql) | Sai user/password MySQL | Kiểm tra lại `MYSQL_USER`/`MYSQL_PASSWORD` trong `.env` khớp với `DATABASE_URL` trong `backend/.env` |
| `Error: listen EADDRINUSE` (backend) | Hiếm gặp với setup này vì không map port ra host | Kiểm tra không có compose file khác đang chạy cùng lúc |

---

## 7. Tạo Proxy Host + SSL trong Nginx Proxy Manager

Vào `http://VPS_IP:81` (hoặc domain nếu đã hardening) → menu **Hosts → Proxy Hosts** → nút
**Add Proxy Host** góc trên phải.

**Host cho frontend:**
1. Tab **Details** → ô **Domain Names**: gõ `yourdomain.com`, nhấn Enter/Tab để nó thành
   "chip" (thẻ bo tròn).
2. **Scheme**: `http` (nội bộ giữa NPM và container đi qua mạng Docker, không cần https ở
   chặng này — HTTPS chỉ cần ở chặng trình duyệt ↔ NPM).
3. **Forward Hostname / IP**: `frontend` (đúng tên container trong `docker-compose.prod.yml`
   — NPM tìm ra được vì cùng nằm trên mạng `proxy`).
4. **Forward Port**: `3000`.
5. Bật **Block Common Exploits**. Không cần bật Websockets Support (không dùng ở project
   này hiện tại).
6. Tab **SSL** → dropdown **SSL Certificate** → **Request a new SSL Certificate** → tick
   **Force SSL**, **HTTP/2 Support**, tick **I Agree to the Let's Encrypt Terms of Service**
   → nhập email của bạn → **Save**.

**Host cho backend:** lặp lại y hệt, đổi:
- Domain Names: `api.yourdomain.com`
- Forward Hostname/IP: `backend`
- Forward Port: `3002`

- **Kỳ vọng**: sau khi Save, NPM tự gọi Let's Encrypt xác thực domain rồi cấp chứng chỉ —
  mất vài giây đến khoảng 1 phút. Xong sẽ thấy icon ổ khoá xanh cạnh domain trong danh sách
  Proxy Hosts.
- **Nếu lỗi khi xin SSL** (`Error creating SSL Certificate` hoặc tương tự):
  - **DNS chưa lan truyền** — quay lại `nslookup yourdomain.com` kiểm tra, đợi thêm rồi thử
    lại (nút **...** cạnh host → **Renew Certificate**).
  - **Cổng 80 bị chặn** — Let's Encrypt xác thực qua HTTP (cổng 80) tới đúng IP domain trỏ
    tới. Kiểm tra `ufw status` đã allow 80, và firewall riêng của nhà cung cấp VPS (Security
    Group) cũng đã mở 80/443.
  - **Domain đang dùng Cloudflare proxy (đám mây cam)** — chuyển về xám (DNS only) như lưu ý
    ở Phase 2, thử lại, có thể bật cam lại sau khi có SSL.
  - **Đã xin cert cho domain này ở nơi khác trước đó, bị giới hạn rate limit của Let's
    Encrypt** (5 lần/tuần cho cùng domain) — đợi hoặc dùng domain/subdomain khác thử trước.
- **Nếu vào domain ra "502 Bad Gateway"** sau khi đã có SSL: forward hostname/port gõ sai
  chính tả, hoặc container tương ứng chưa chạy — kiểm tra
  `docker compose -f docker-compose.prod.yml ps` ở VPS.

---

## 8. Kiểm tra sau deploy

Test bằng `curl` (chạy trên máy bạn hoặc VPS đều được):

```bash
curl -I https://api.yourdomain.com/api/health
```

Kỳ vọng dòng đầu tiên là `HTTP/2 200`. Nếu muốn xem nội dung trả về:

```bash
curl https://api.yourdomain.com/api/health
```

Kỳ vọng: `{"status":"ok"}`.

Mở `https://yourdomain.com` bằng trình duyệt — trang chủ phải hiện **Backend: connected**.
Nếu hiện lỗi kết nối, mở DevTools (F12) → tab **Console**/**Network** xem lỗi cụ thể:

- Lỗi liên quan **CORS** (`has been blocked by CORS policy`) → `FRONTEND_URL` trong
  `backend/.env` không khớp chính xác origin đang mở — sửa lại rồi
  `docker compose -f docker-compose.prod.yml up -d backend` (không cần build lại, chỉ
  restart vì đây là biến đọc lúc chạy, không phải lúc build).
- Lỗi `Failed to fetch` / `ERR_CONNECTION_REFUSED` tới domain api → Proxy Host cho backend
  chưa đúng, hoặc backend container chưa chạy — xem lại Phase 6–7.

Thử **đăng ký** rồi **đăng nhập** trên trang — sau đăng nhập, mở F12 → tab **Application**
(Chrome/Edge) hoặc **Storage** (Firefox) → **Cookies** → chọn domain `yourdomain.com` → tìm
dòng `session_token`. Kỳ vọng thấy cột `Secure` = true, `HttpOnly` = true.

Cookie hoạt động xuyên được 2 subdomain (`yourdomain.com` và `api.yourdomain.com`) vì
`sameSite: 'lax'` coi các subdomain cùng domain gốc là "same-site" — không cần cấu hình gì
thêm cho việc này.

---

## 9. Deploy các lần sau (cập nhật code)

```bash
cd ~/comic-store
git pull
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

Chỉ backend hoặc chỉ frontend thay đổi thì build/up riêng service đó cho nhanh hơn:

```bash
docker compose -f docker-compose.prod.yml build backend
docker compose -f docker-compose.prod.yml up -d backend
```

> **Lưu ý riêng cho `NEXT_PUBLIC_API_URL`**: biến này được nhúng thẳng vào file JS lúc
> `build`, không đọc lại lúc container chạy. Đổi giá trị trong `.env` rồi `up -d` **không đủ**
> — bắt buộc phải build lại image `frontend`:
> ```bash
> docker compose -f docker-compose.prod.yml build frontend
> docker compose -f docker-compose.prod.yml up -d frontend
> ```

Kiểm tra container chạy đúng sau update, giống Phase 6:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend
```

Dọn image cũ không dùng nữa định kỳ (mỗi image build mới không tự xoá image cũ, lâu ngày đầy
đĩa):

```bash
docker image prune -f
```

---

## 10. Backup / restore database

### Backup thủ công

```bash
cd ~/comic-store
docker compose -f docker-compose.prod.yml exec mysql \
  sh -c 'exec mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" comic_store' \
  > backup-$(date +%F).sql
```

- **Lệnh này làm gì**: `exec` chạy lệnh `mysqldump` bên trong container `mysql` đang chạy,
  xuất toàn bộ database `comic_store` ra dạng SQL text, rồi `>` ghi ra file trên VPS tên
  `backup-2026-08-18.sql` (ngày hiện tại).
- **Kỳ vọng**: file `.sql` tạo ra có dung lượng > 0 byte (`ls -lh backup-*.sql` để kiểm tra).
  Nếu file dung lượng 0 hoặc lệnh báo lỗi `Access denied`, kiểm tra lại
  `MYSQL_ROOT_PASSWORD` trong `.env` có đúng không.

### Restore từ file backup

```bash
cat backup-2026-08-18.sql | docker compose -f docker-compose.prod.yml exec -T mysql \
  sh -c 'exec mysql -u root -p"$MYSQL_ROOT_PASSWORD" comic_store'
```

> Lệnh này **ghi đè** dữ liệu hiện có trong database bằng nội dung file backup — chỉ chạy
> khi thực sự muốn khôi phục lại trạng thái cũ.

### Tự động backup mỗi đêm bằng cron

```bash
mkdir -p ~/backups
crontab -e
```

- Lần đầu `crontab -e` sẽ hỏi chọn trình soạn thảo — gõ số tương ứng với **nano** trong danh
  sách rồi Enter.
- Thêm dòng này vào cuối file (chạy lúc 2 giờ sáng mỗi ngày), lưu bằng `Ctrl+O` → Enter →
  thoát `Ctrl+X`:

```
0 2 * * * cd /home/deploy/comic-store && docker compose -f docker-compose.prod.yml exec -T mysql sh -c 'exec mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" comic_store' > /home/deploy/backups/backup-$(date +\%F).sql 2>> /home/deploy/backups/backup.log
```

> Trong crontab, dấu `%` phải viết thành `\%` (thoát ký tự) vì `%` có ý nghĩa đặc biệt trong
> cron — nếu quên, lệnh sẽ không chạy đúng ngày tháng.

Nên định kỳ (vài tuần/lần) dọn các file backup cũ trong `~/backups` để không đầy đĩa, hoặc
thêm 1 dòng cron khác dùng `find ~/backups -mtime +30 -delete` để tự xoá backup quá 30 ngày.

---

## 11. Thêm project thứ 2 trên cùng VPS

Nginx Proxy Manager và mạng `proxy` ở Phase 5 chỉ cần dựng **một lần** cho cả server. Project
mới sau này chỉ cần:

1. `git clone` project vào thư mục riêng, ví dụ `~/project-2` (không nằm trong
   `~/comic-store`).
2. File `docker-compose.yml` của project đó join vào mạng `proxy` (`external: true`), giống
   cách Comic Store đang làm trong `docker-compose.prod.yml`.
3. `docker compose up -d` trong thư mục project đó.
4. Vào NPM (`http://VPS_IP:81`), thêm Proxy Host + SSL mới — trỏ tới tên container của
   project mới, domain mới.

Không cần đụng vào NPM, mạng `proxy`, file `.env`, hay bất kỳ container nào của Comic Store.

---

## 12. Bảng lệnh tra cứu nhanh

Chạy trong thư mục `~/comic-store`, đã có sẵn `docker-compose.prod.yml`:

| Muốn làm gì | Lệnh |
| --- | --- |
| Xem trạng thái container | `docker compose -f docker-compose.prod.yml ps` |
| Xem log 1 service, theo dõi live | `docker compose -f docker-compose.prod.yml logs -f backend` |
| Khởi động lại 1 service | `docker compose -f docker-compose.prod.yml restart backend` |
| Build lại sau khi đổi code | `docker compose -f docker-compose.prod.yml build` |
| Áp dụng image mới build | `docker compose -f docker-compose.prod.yml up -d` |
| Dừng toàn bộ (giữ data) | `docker compose -f docker-compose.prod.yml down` |
| Dừng + **xoá luôn data MySQL** | `docker compose -f docker-compose.prod.yml down -v` ⚠️ |
| Vào shell bên trong 1 container | `docker compose -f docker-compose.prod.yml exec backend sh` |
| Xem dung lượng đĩa còn lại | `df -h` |
| Dọn image Docker cũ không dùng | `docker image prune -f` |

