# Deploy Comic Store lên VPS

Hướng dẫn triển khai Comic Store lên VPS bằng **PM2 + Nginx + MySQL cài trực tiếp** (không
Docker), viết chi tiết từng lệnh — kể cả bạn chưa từng làm sysadmin cũng làm theo được. Áp
dụng cho VPS Ubuntu 22.04/24.04.

> **Vì sao không dùng Docker ở VPS?** VPS cấu hình thấp (1–2GB RAM) chạy thêm Docker daemon +
> mỗi service một container riêng (kèm layer hệ điều hành riêng) tốn thêm RAM đáng kể so với
> chạy Node.js/MySQL/Nginx trực tiếp trên VPS. Đổi lại bạn tự quản lý version Node/MySQL cài
> trên máy (không "đóng hộp" như Docker), nhưng với 1 project trên VPS thì đánh đổi này đáng
> để tiết kiệm bộ nhớ.

> Máy dev local **không đổi gì cả** — vẫn dùng MySQL cài trực tiếp + HeidiSQL như đang làm
> (xem README.md). Toàn bộ nội dung dưới đây chỉ áp dụng cho VPS.

## Mục lục

- [0. Khái niệm cơ bản](#0-khái-niệm-cơ-bản)
- [1. Trước khi bắt đầu](#1-trước-khi-bắt-đầu)
- [2. Trỏ DNS về VPS](#2-trỏ-dns-về-vps)
- [3. SSH vào VPS lần đầu + bảo mật cơ bản](#3-ssh-vào-vps-lần-đầu--bảo-mật-cơ-bản)
- [4. Cài Node.js, MySQL, Nginx, PM2, Certbot](#4-cài-nodejs-mysql-nginx-pm2-certbot)
- [5. Tạo database MySQL](#5-tạo-database-mysql)
- [6. Deploy Comic Store (lần đầu)](#6-deploy-comic-store-lần-đầu)
- [7. Cấu hình Nginx + SSL bằng Certbot](#7-cấu-hình-nginx--ssl-bằng-certbot)
- [8. Kiểm tra sau deploy](#8-kiểm-tra-sau-deploy)
- [9. Deploy các lần sau (cập nhật code)](#9-deploy-các-lần-sau-cập-nhật-code)
- [10. Backup / restore database](#10-backup--restore-database)
- [11. Thêm project thứ 2 trên cùng VPS](#11-thêm-project-thứ-2-trên-cùng-vps)
- [12. Bảng lệnh tra cứu nhanh](#12-bảng-lệnh-tra-cứu-nhanh)

---

## 0. Khái niệm cơ bản

Đọc phần này trước nếu chưa quen — mỗi bước sau đều dựa vào các khái niệm này.

- **VPS**: một máy tính Linux thuê từ xa, có địa chỉ IP riêng, bạn có toàn quyền (root) như
  ngồi trước máy đó. Khác Shared Hosting ở chỗ không có cPanel/giao diện sẵn — mọi thứ làm
  qua dòng lệnh.
- **SSH**: cách bạn "kết nối từ xa" vào VPS để gõ lệnh, giống Remote Desktop nhưng chỉ có
  terminal chữ, không có màn hình đồ hoạ.
- **Domain & DNS**: domain (`yourdomain.com`) là cái tên; DNS là "danh bạ điện thoại" ánh xạ
  tên đó sang IP VPS. Sau khi sửa DNS phải đợi nó **lan truyền** (propagate) đi khắp nơi
  trên mạng — có thể vài phút, có thể vài giờ.
- **PM2**: một "process manager" cho Node.js — giữ cho `node dist/main.js` (backend) và
  `next start` (frontend) luôn chạy nền, tự khởi động lại nếu app crash, và tự chạy lại khi
  VPS reboot. Thay thế vai trò mà trước đây Docker `restart: unless-stopped` đảm nhiệm.
- **Nginx (reverse proxy)**: một "lễ tân" đứng giữa internet và các app Node đang chạy ở các
  cổng nội bộ (3000, 3002). Mọi request tới `yourdomain.com` đều gõ cửa Nginx trước; Nginx đọc
  **đường dẫn** (`/api/...` hay không) rồi chuyển tiếp (proxy) vào đúng cổng nội bộ tương ứng,
  đồng thời lo luôn HTTPS/SSL. Project này dùng **1 domain duy nhất** (không có subdomain
  `api.`) — frontend và backend cùng chạy chung sau lưng 1 domain, phân biệt nhau bằng path.
- **Certbot**: công cụ xin chứng chỉ SSL miễn phí từ Let's Encrypt, tích hợp thẳng với Nginx
  — tự sửa file cấu hình Nginx để bật HTTPS, không cần thao tác thủ công.

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

Project dùng **1 domain duy nhất** — không cần subdomain `api.` riêng, vì frontend và backend
cùng chạy sau lưng 1 domain, Nginx phân biệt nhau bằng path (`/api/...` → backend, còn lại →
frontend, xem [Phase 7](#7-cấu-hình-nginx--ssl-bằng-certbot)). Vào trang quản lý DNS của
domain, thêm **2 bản ghi A** trỏ về IP VPS — domain gốc và `www` (thay `yourdomain.com` bằng
domain thật, thay `VPS_IP` bằng IP thật):

| Loại | Tên/Host | Giá trị/Value | Ý nghĩa |
| --- | --- | --- | --- |
| A | `@` | `VPS_IP` | `yourdomain.com` — domain chính, phục vụ toàn bộ app |
| A | `www` | `VPS_IP` | `www.yourdomain.com` — chỉ để redirect về domain chính |

- **Vì sao có `www` nếu domain chính đã là `@`?**: chỉ để hứng người dùng lỡ gõ
  `www.yourdomain.com` (thói quen cũ, hoặc gõ tự động của trình duyệt) — Nginx sẽ cấu hình
  `www` **redirect 301** sang domain gốc ([Phase 7](#7-cấu-hình-nginx--ssl-bằng-certbot)), chứ
  không phục vụ nội dung riêng. Không bắt buộc phải có bản ghi này, nhưng nếu đã trỏ sẵn (như
  trong ảnh bạn gửi) thì tận dụng luôn, tránh lỗi "trang không tồn tại" khi ai đó gõ `www.`.
- **`yourdomain.com` (không `www`) là domain chính (canonical)** dùng xuyên suốt hướng dẫn —
  mọi giá trị `FRONTEND_URL`, `NEXT_PUBLIC_API_URL` ở Phase 6 đều dùng dạng không-`www`.

> **DNS trỏ xong không có nghĩa là VPS đã "nhận" được request** — bản ghi A chỉ giúp trình
> duyệt biết cần gửi request tới IP nào, giống như biết địa chỉ nhà nhưng chưa chắc có ai ra
> mở cửa. Phía VPS còn cần 2 việc nữa mới thực sự trả lời được: mở cổng 80/443 ở firewall
> ([Phase 3](#3-ssh-vào-vps-lần-đầu--bảo-mật-cơ-bản)), và có Nginx lắng nghe + biết ánh xạ
> đúng path vào đúng app ([Phase 7](#7-cấu-hình-nginx--ssl-bằng-certbot)). Thiếu 1 trong 2,
> trình duyệt sẽ báo timeout hoặc connection refused dù `nslookup` đã ra đúng IP.

Giao diện mỗi nhà cung cấp domain khác nhau nhưng đều có mục **DNS / DNS Records / Zone
Editor**. Trường "Tên"/"Host"/"Name" nhập `@` (nghĩa là chính domain gốc — một số nhà cung
cấp cho để trống thay vì `@`, tuỳ giao diện). Trường "Loại"/"Type" chọn **A** (không phải
`NS` — `NS` dùng cho việc khác, trỏ máy chủ DNS, không phải trỏ IP). Trường
"Giá trị"/"Value"/"Points to" nhập IP VPS. Trường "Độ ưu tiên"/"Priority" để trống (chỉ dùng
cho bản ghi MX/email). TTL để mặc định là được.

**Kiểm tra đã lan truyền chưa** (chạy trên máy bạn, PowerShell cũng được):

```bash
nslookup yourdomain.com
```

Kỳ vọng thấy dòng `Address:` là đúng IP VPS. Nếu ra IP khác hoặc báo không tìm thấy — DNS
chưa kịp lan truyền, đợi thêm (kiểm tra thêm ở [whatsmydns.net](https://www.whatsmydns.net)
để xem trạng thái nhiều nơi trên thế giới cùng lúc). Có thể làm tiếp Phase 3–6 song song
trong lúc chờ DNS, chỉ cần DNS trỏ đúng **trước** khi tới bước xin SSL ở Phase 7.

> **Nếu domain đang dùng Cloudflare**: khi thêm bản ghi A, đám mây cạnh bản ghi phải để
> **xám (DNS only)**, không để **cam (Proxied)** — nếu để cam, Certbot sẽ không xin được SSL
> vì Cloudflare đứng chặn ở giữa. Có thể bật cam lại sau khi đã có SSL nếu muốn dùng CDN của
> Cloudflare (nằm ngoài phạm vi hướng dẫn này).

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
ufw enable
```

- **`ufw allow OpenSSH`**: mở cổng 22 (SSH) — **bắt buộc phải chạy dòng này trước khi
  `enable`**, nếu quên, bật firewall xong bạn sẽ mất kết nối SSH vĩnh viễn và phải nhờ nhà
  cung cấp VPS mở "Console cứu hộ" để vào gỡ.
- **`ufw allow 80` / `443`**: mở cổng web thường (HTTP) và web bảo mật (HTTPS) — nơi Nginx sẽ
  lắng nghe. Cổng MySQL (3306) và cổng nội bộ của Node (3000/3002) **không** mở ra ngoài —
  chỉ Nginx trên chính VPS gọi vào, nên không cần thiết và mở ra chỉ tăng rủi ro.
- **`ufw enable`**: kỳ vọng hỏi
  `Command may disrupt existing ssh connections. Proceed with operation (y|n)?` → gõ `y`.

Kiểm tra lại:

```bash
ufw status
```

Kỳ vọng thấy `Status: active` và danh sách `22`, `80`, `443` đều `ALLOW`.

Đăng xuất khỏi root, SSH lại bằng user `deploy` — từ đây về sau **dùng user `deploy` cho mọi
lệnh còn lại** trong hướng dẫn này:

```bash
exit
```

```bash
ssh deploy@VPS_IP
```

---

## 4. Cài Node.js, MySQL, Nginx, PM2, Certbot

Vẫn đang là user `deploy`.

### Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

- **Lệnh này làm gì**: thêm repository chính thức của NodeSource cho Node.js 20 vào `apt`,
  rồi cài Node (kèm `npm`) từ repository đó — bản Node trong kho `apt` mặc định của Ubuntu
  thường cũ hơn nhiều so với bản project cần.
- **Kiểm tra**:
  ```bash
  node -v
  npm -v
  ```
  Kỳ vọng `node -v` in ra `v20.x.x`.

### MySQL Server

```bash
sudo apt install -y mysql-server
```

- **Kỳ vọng**: cài xong, MySQL tự khởi động như 1 service của hệ điều hành (`systemd`), lắng
  nghe ở `127.0.0.1:3306` (chỉ máy VPS tự gọi được, không lộ ra internet — mặc định của
  MySQL trên Ubuntu, an toàn sẵn không cần chỉnh).

Chạy script bảo mật đi kèm:

```bash
sudo mysql_secure_installation
```

Lần lượt trả lời (đây là script hỏi-đáp tương tác):

1. `VALIDATE PASSWORD COMPONENT` → gõ `y` nếu muốn ép mật khẩu mạnh cho các user tạo sau
   này, hoặc `n` nếu tự tin tự đặt mật khẩu đủ mạnh (khuyến nghị `y`).
2. Nếu chọn `y` ở trên: chọn độ mạnh (0 = LOW, 1 = MEDIUM, 2 = STRONG) → gõ `1` là hợp lý.
3. `Set root password?` → gõ `y`, đặt mật khẩu cho user `root` của MySQL (**khác** mật khẩu
   SSH), gõ 2 lần.
4. `Remove anonymous users?` → `y`.
5. `Disallow root login remotely?` → `y` (root MySQL chỉ nên login từ chính VPS).
6. `Remove test database and access to it?` → `y`.
7. `Reload privilege tables now?` → `y`.

### Nginx

```bash
sudo apt install -y nginx
```

- **Kỳ vọng**: Nginx tự khởi động như 1 service, lắng nghe cổng 80. Kiểm tra:
  ```bash
  sudo systemctl status nginx
  ```
  Kỳ vọng thấy dòng `Active: active (running)` màu xanh (`q` để thoát màn hình status).

### PM2

```bash
sudo npm install -g pm2
```

- **Kiểm tra**: `pm2 -v` in ra số phiên bản.

### Certbot (xin SSL miễn phí)

```bash
sudo apt install -y certbot python3-certbot-nginx
```

- `python3-certbot-nginx` là plugin giúp Certbot tự sửa file cấu hình Nginx để bật HTTPS,
  dùng ở [Phase 7](#7-cấu-hình-nginx--ssl-bằng-certbot).

---

## 5. Tạo database MySQL

Đăng nhập MySQL bằng user `root` vừa đặt mật khẩu ở Phase 4:

```bash
sudo mysql -u root -p
```

Trong dấu nhắc `mysql>` hiện ra, chạy lần lượt (thay `STRONG_PASSWORD` bằng mật khẩu mạnh
riêng cho user này, **khác** mật khẩu root MySQL):

```sql
CREATE DATABASE comic_store CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER 'comic_user'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON comic_store.* TO 'comic_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

- **`'comic_user'@'localhost'`**: user này chỉ được login từ `localhost` (chính VPS) — đúng
  ý vì backend cũng chạy ngay trên VPS, gọi MySQL qua `localhost:3306`, không cần user gọi
  được từ xa.
- **Charset/collation**: khớp với quy ước trong `docker/mysql/init/schema.sql` (xem comment
  đầu file đó) — giữ nguyên để tiếng Việt so khớp/sắp xếp đúng.

Ghi nhớ lại `STRONG_PASSWORD` — cần dùng ở bước tạo `backend/.env` tại Phase 6.

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
cp backend/.env.example backend/.env
nano backend/.env
```

Điền giá trị thật (xem lại [Cách dùng nano](#cách-dùng-nano-trình-soạn-thảo-trong-terminal)
ở trên nếu quên thao tác):

```dotenv
PORT=3002
DATABASE_URL="mysql://comic_user:STRONG_PASSWORD@localhost:3306/comic_store"
FRONTEND_URL="https://yourdomain.com"
NODE_ENV=production
```

- **`localhost:3306` chứ không phải tên container**: vì MySQL cài trực tiếp trên VPS (Phase
  4–5), backend gọi thẳng qua `localhost` — không còn khái niệm "tên service" như lúc dùng
  Docker network.
- **`STRONG_PASSWORD`**: đúng mật khẩu đã đặt cho `comic_user` ở Phase 5.
- **`NODE_ENV=production`**: bắt buộc — thiếu biến này, cookie đăng nhập sẽ không bật cờ
  `secure`, kém an toàn hơn khi chạy qua domain thật (xem
  `backend/src/auth/auth.controller.ts:40`).
- **`FRONTEND_URL` phải khớp chính xác** origin trình duyệt sẽ dùng, kể cả `https://`, không
  có dấu `/` ở cuối — sai chỗ này là nguyên nhân phổ biến nhất của lỗi CORS ở Phase 8.

```bash
cp frontend/.env.example frontend/.env.production.local
nano frontend/.env.production.local
```

```dotenv
NEXT_PUBLIC_API_URL="https://yourdomain.com/api"
```

- **`.env.production.local`**: Next.js tự động đọc file này khi chạy `npm run build` (build
  ở chế độ production) — không cần cấu hình gì thêm để nó được nhận.
- **`NEXT_PUBLIC_*` được nhúng thẳng vào file JS lúc `build`**, không đọc lại lúc chạy `next
  start`. Đổi giá trị trong file này **không đủ** để áp dụng cho app đang chạy — bắt buộc
  phải build lại (xem lại ở [Phase 9](#9-deploy-các-lần-sau-cập-nhật-code)).

### Cài dependencies và build

```bash
npm install
```

- **Lệnh này làm gì**: cài dependencies cho cả `frontend` và `backend` cùng lúc thông qua npm
  workspaces (đọc `workspaces` trong `package.json` ở root), đồng thời tự chạy
  `prisma generate` (hook `postinstall` của `backend/package.json`).
- **Kỳ vọng**: kết thúc không có dòng nào bắt đầu bằng `npm error`. Lần đầu có thể mất vài
  phút do tải toàn bộ package.
- **Nếu lỗi** liên quan `package-lock.json` (ví dụ `npm ci can only install packages when...`)
  — lockfile trên VPS (từ git) không khớp code. Trên máy dev, chạy `npm install`, commit
  `package-lock.json` mới, push, rồi `git pull` lại trên VPS và cài lại.

```bash
npm run build --prefix backend
npm run build --prefix frontend
```

- **`--prefix backend`**: chạy script `build` định nghĩa trong `backend/package.json`
  (`nest build`) nhưng vẫn đứng ở thư mục root — tương đương `cd backend && npm run build`.
- **Kỳ vọng**: `backend` sinh ra thư mục `backend/dist/` (chứa `main.js`), `frontend` sinh ra
  thư mục `frontend/.next/`. Không có dòng nào bắt đầu bằng `error TS` (backend) hay build
  fail (frontend).
- **Nếu lỗi biên dịch TypeScript** (`error TS...`) — code đang lỗi build thật sự, không liên
  quan VPS. Chạy lại đúng lệnh này trên máy dev để tái hiện và sửa lỗi trước, rồi push lại.

### Import schema database

```bash
mysql -u comic_user -p comic_store < docker/mysql/init/schema.sql
```

- **Lệnh này làm gì**: chạy toàn bộ file `schema.sql` (nguồn sự thật cho cấu trúc bảng, xem
  comment đầu file đó) để tạo bảng trong database `comic_store` vừa tạo ở Phase 5. File này
  dùng chung với máy dev local, không có gì đổi khi chuyển sang chạy trên VPS.
- **Kỳ vọng**: chạy xong quay lại dấu nhắc lệnh, không có dòng `ERROR`.
- Nhập mật khẩu của `comic_user` (đặt ở Phase 5) khi được hỏi (`Enter password:`).

### Chạy bằng PM2

```bash
pm2 start ecosystem.config.js
```

- **Lệnh này làm gì**: đọc `ecosystem.config.js` ở root repo, khởi động 2 process nền:
  `comic-backend` (`node backend/dist/main.js`) và `comic-frontend` (`npm start` trong thư
  mục `frontend`, tức `next start`, mặc định lắng nghe cổng 3000).
- **Kỳ vọng**:
  ```bash
  pm2 status
  ```
  hiện bảng với 2 dòng `comic-backend` và `comic-frontend`, cột `status` đều `online`.
- **Nếu 1 process hiện `errored` hoặc liên tục restart** — xem log để biết lý do cụ thể:
  ```bash
  pm2 logs comic-backend --lines 50
  pm2 logs comic-frontend --lines 50
  ```

Cho PM2 tự khởi động lại 2 app này khi VPS reboot:

```bash
pm2 save
pm2 startup systemd -u deploy --hp /home/deploy
```

- **`pm2 save`**: lưu danh sách process đang chạy (`comic-backend`, `comic-frontend`) vào
  file để khôi phục sau này.
- **`pm2 startup ...`**: in ra **một dòng lệnh `sudo env PATH=... pm2 startup systemd -u
  deploy --hp /home/deploy`** — copy nguyên dòng đó và chạy tiếp (đây là bước bắt buộc,
  lệnh gốc chỉ tạo ra lệnh cần chạy chứ chưa tự chạy). Sau đó chạy lại `pm2 save` một lần
  nữa để chắc chắn danh sách được lưu vào service vừa đăng ký.
- **Kỳ vọng kiểm tra**: `sudo systemctl status pm2-deploy` hiện `active (running)`.

---

## 7. Cấu hình Nginx + SSL bằng Certbot

Chỉ cần **1 file cấu hình Nginx**, chứa 2 `server` block: block chính phân biệt request bằng
path (`/api/...` → backend), block phụ chỉ để redirect `www` về domain chính.

```bash
sudo nano /etc/nginx/sites-available/yourdomain.com
```

Dán nội dung sau (thay **cả 3 chỗ** `yourdomain.com` bằng domain thật):

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location /api/ {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name www.yourdomain.com;
    return 301 https://yourdomain.com$request_uri;
}
```

- **`location /api/`**: mọi request tới `yourdomain.com/api/...` chuyển vào cổng `3002` —
  đúng nơi `comic-backend` đang chạy (khớp `PORT=3002` trong `backend/.env`). Backend đã tự
  gắn prefix `api` cho toàn bộ route của nó (`app.setGlobalPrefix('api')` trong
  `backend/src/main.ts`), nên đường dẫn không bị lệch khi Nginx forward nguyên `/api/...`
  sang backend.
- **`location /uploads/`**: ảnh upload (danh mục, sản phẩm...) do backend serve tĩnh từ thư
  mục `backend/uploads/`, cũng cần trỏ vào cổng `3002` — thiếu block này thì ảnh sẽ ra lỗi
  404 dù API vẫn chạy bình thường.
- **`location /`**: mọi request còn lại (trang HTML, JS, CSS...) chuyển vào cổng `3000` — nơi
  `comic-frontend` (`next start`) đang chạy.
- **Thứ tự 3 block trong `server` đầu không quan trọng** — Nginx tự chọn block khớp path dài
  nhất trước (`/api/`, `/uploads/` luôn thắng `/` bất kể đứng trước hay sau trong file).
- **`server` thứ 2 (`www.yourdomain.com`)**: chỉ để redirect người lỡ gõ `www.` về domain
  chính, **không** phục vụ nội dung riêng — tránh session/cookie bị tách rời giữa 2 dạng
  domain (cookie đặt ở `yourdomain.com` sẽ không tự có hiệu lực trên `www.yourdomain.com` nếu
  không redirect). Bỏ qua block này nếu bạn không tạo bản ghi DNS `www` ở Phase 2.

Kích hoạt site vừa tạo (tạo symlink từ `sites-available` sang `sites-enabled`):

```bash
sudo ln -s /etc/nginx/sites-available/yourdomain.com /etc/nginx/sites-enabled/
```

Kiểm tra cú pháp rồi áp dụng:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

- **`nginx -t`**: kỳ vọng thấy `syntax is ok` và `test is successful`. Nếu báo lỗi — đọc
  thông báo, thường là gõ thiếu dấu `;` hoặc `{` `}` không khớp trong file vừa tạo.

Mở `http://yourdomain.com` và `http://yourdomain.com/api/health` bằng trình duyệt — kỳ vọng
đã thấy nội dung trả về qua HTTP (chưa có ổ khoá HTTPS, bước tiếp theo mới bật).

- **Nếu ra `502 Bad Gateway`** — PM2 process tương ứng chưa chạy hoặc crash, kiểm tra lại
  `pm2 status` và `pm2 logs`.
- **Nếu không vào được trang** — DNS chưa trỏ đúng ([Phase 2](#2-trỏ-dns-về-vps)), hoặc
  firewall của nhà cung cấp VPS (Security Group) chưa mở 80/443 ngoài `ufw`.

### Xin SSL

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

- **Lệnh này làm gì**: Certbot xác thực quyền sở hữu cả 2 domain qua cổng 80, xin 1 chứng chỉ
  SSL dùng chung cho cả `yourdomain.com` và `www.yourdomain.com`, rồi **tự động sửa** cả 2
  `server` block trong file cấu hình Nginx vừa tạo để thêm `listen 443 ssl`, đường dẫn chứng
  chỉ, và redirect HTTP → HTTPS (block `www` vẫn giữ nguyên hành vi redirect sang domain
  chính, chỉ thêm SSL để redirect an toàn ngay cả khi ai đó gõ `https://www...` trực tiếp).
- **Nếu bạn không tạo bản ghi DNS `www`** ở Phase 2 — bỏ `-d www.yourdomain.com` và bỏ luôn
  `server` block thứ 2 ở bước trên.
- **Lần đầu chạy sẽ hỏi**:
  - Email — dùng để Let's Encrypt gửi cảnh báo trước khi chứng chỉ hết hạn.
  - Đồng ý Terms of Service → gõ `Y`.
  - Có muốn share email cho EFF không → tuỳ chọn, `Y` hoặc `N` đều được.
- **Kỳ vọng**: kết thúc bằng thông báo `Successfully deployed certificate` cho cả 2 domain.
- **Nếu lỗi khi xin SSL**:
  - **DNS chưa lan truyền** — quay lại `nslookup yourdomain.com` kiểm tra, đợi thêm rồi chạy
    lại đúng lệnh trên.
  - **Cổng 80 bị chặn** — Let's Encrypt xác thực qua HTTP (cổng 80) tới đúng IP domain trỏ
    tới. Kiểm tra `ufw status` đã allow 80, và firewall riêng của nhà cung cấp VPS (Security
    Group) cũng đã mở 80/443.
  - **Domain đang dùng Cloudflare proxy (đám mây cam)** — chuyển về xám (DNS only) như lưu ý
    ở Phase 2, thử lại, có thể bật cam lại sau khi có SSL.
  - **Đã xin cert cho domain này ở nơi khác trước đó, bị giới hạn rate limit của Let's
    Encrypt** (5 lần/tuần cho cùng domain) — đợi hoặc thử lại sau.

Chứng chỉ Let's Encrypt hết hạn sau 90 ngày nhưng Certbot tự cài sẵn 1 cron/systemd timer gia
hạn tự động — không cần làm gì thêm. Kiểm tra timer đang bật:

```bash
sudo systemctl status certbot.timer
```

---

## 8. Kiểm tra sau deploy

Test bằng `curl` (chạy trên máy bạn hoặc VPS đều được):

```bash
curl -I https://yourdomain.com/api/health
```

Kỳ vọng dòng đầu tiên là `HTTP/2 200`. Nếu muốn xem nội dung trả về:

```bash
curl https://yourdomain.com/api/health
```

Kỳ vọng: `{"status":"ok"}`.

Nếu có tạo bản ghi `www`, kiểm tra redirect hoạt động đúng:

```bash
curl -I https://www.yourdomain.com
```

Kỳ vọng thấy `HTTP/2 301` và dòng `location: https://yourdomain.com/`.

Mở `https://yourdomain.com` bằng trình duyệt — trang chủ phải hiện **Backend: connected**.
Nếu hiện lỗi kết nối, mở DevTools (F12) → tab **Console**/**Network** xem lỗi cụ thể:

- Lỗi `Failed to fetch` / `404` tới `/api/...` → block `location /api/` trong cấu hình
  Nginx sai, hoặc `comic-backend` chưa chạy — xem lại Phase 6–7.
- Lỗi liên quan **CORS** (`has been blocked by CORS policy`) — khó xảy ra vì frontend/backend
  giờ cùng chung 1 origin (`https://yourdomain.com`), nhưng nếu vẫn thấy, kiểm tra lại
  `FRONTEND_URL` trong `backend/.env` có khớp chính xác `https://yourdomain.com` không, sửa
  rồi `pm2 restart comic-backend` (không cần build lại, chỉ restart vì đây là biến đọc lúc
  chạy, không phải lúc build).

Thử **đăng ký** rồi **đăng nhập** trên trang — sau đăng nhập, mở F12 → tab **Application**
(Chrome/Edge) hoặc **Storage** (Firefox) → **Cookies** → chọn domain `yourdomain.com` → tìm
dòng `session_token`. Kỳ vọng thấy cột `Secure` = true, `HttpOnly` = true.

---

## 9. Deploy các lần sau (cập nhật code)

```bash
cd ~/comic-store
git pull
npm install
npm run build --prefix backend
npm run build --prefix frontend
pm2 restart ecosystem.config.js
```

- **`npm install`**: chỉ cần khi `package-lock.json` có thay đổi (thêm/bớt dependency), nhưng
  chạy lại luôn cũng vô hại, chỉ tốn thêm vài giây nếu không có gì thay đổi.
- **`pm2 restart ecosystem.config.js`**: khởi động lại cả 2 process với code/build mới nhất,
  không mất cấu hình đã lưu (`pm2 save` ở Phase 6).

Chỉ backend hoặc chỉ frontend thay đổi thì build/restart riêng service đó cho nhanh hơn:

```bash
npm run build --prefix backend
pm2 restart comic-backend
```

> **Lưu ý riêng cho `NEXT_PUBLIC_API_URL`**: biến này được nhúng thẳng vào file JS lúc
> `npm run build --prefix frontend`, không đọc lại lúc `pm2 restart`. Đổi giá trị trong
> `frontend/.env.production.local` rồi chỉ `pm2 restart` **không đủ** — bắt buộc phải build
> lại:
> ```bash
> npm run build --prefix frontend
> pm2 restart comic-frontend
> ```

Kiểm tra chạy đúng sau update, giống Phase 6:

```bash
pm2 status
pm2 logs comic-backend --lines 50
```

---

## 10. Backup / restore database

### Backup thủ công

```bash
mkdir -p ~/backups
mysqldump -u comic_user -p comic_store > ~/backups/backup-$(date +%F).sql
```

- **Lệnh này làm gì**: xuất toàn bộ database `comic_store` ra dạng SQL text, ghi ra file tên
  `backup-2026-08-18.sql` (ngày hiện tại) trong `~/backups`.
- **Kỳ vọng**: file `.sql` tạo ra có dung lượng > 0 byte (`ls -lh ~/backups/backup-*.sql` để
  kiểm tra). Nếu lệnh báo lỗi `Access denied`, kiểm tra lại mật khẩu `comic_user`.

### Restore từ file backup

```bash
mysql -u comic_user -p comic_store < ~/backups/backup-2026-08-18.sql
```

> Lệnh này **ghi đè** dữ liệu hiện có trong database bằng nội dung file backup — chỉ chạy
> khi thực sự muốn khôi phục lại trạng thái cũ.

### Tự động backup mỗi đêm bằng cron

Vì backup tự động chạy không có người ngồi gõ mật khẩu, tạo file credentials riêng cho
`mysqldump` đọc:

```bash
nano ~/.my.cnf
```

```ini
[client]
user=comic_user
password=STRONG_PASSWORD
```

```bash
chmod 600 ~/.my.cnf
```

- **`chmod 600`**: chỉ user `deploy` đọc/ghi được file này — bắt buộc vì file chứa mật khẩu
  dạng plain text.

```bash
crontab -e
```

- Lần đầu `crontab -e` sẽ hỏi chọn trình soạn thảo — gõ số tương ứng với **nano** trong danh
  sách rồi Enter.
- Thêm dòng này vào cuối file (chạy lúc 2 giờ sáng mỗi ngày), lưu bằng `Ctrl+O` → Enter →
  thoát `Ctrl+X`:

```
0 2 * * * mysqldump comic_store > /home/deploy/backups/backup-$(date +\%F).sql 2>> /home/deploy/backups/backup.log
```

- Không cần `-u`/`-p` nữa vì `mysqldump` tự đọc `~/.my.cnf`.
- Trong crontab, dấu `%` phải viết thành `\%` (thoát ký tự) vì `%` có ý nghĩa đặc biệt trong
  cron — nếu quên, lệnh sẽ không chạy đúng ngày tháng.

Nên định kỳ (vài tuần/lần) dọn các file backup cũ trong `~/backups` để không đầy đĩa, hoặc
thêm 1 dòng cron khác dùng `find ~/backups -mtime +30 -delete` để tự xoá backup quá 30 ngày.

---

## 11. Thêm project thứ 2 trên cùng VPS

Nginx, MySQL, PM2, Certbot ở các Phase trên đều là service **dùng chung cho cả server**, chỉ
cài **một lần**. Project mới sau này chỉ cần:

1. `git clone` project vào thư mục riêng, ví dụ `~/project-2` (không nằm trong
   `~/comic-store`).
2. Tạo thêm 1 database + user MySQL riêng cho project đó (lặp lại [Phase 5](#5-tạo-database-mysql),
   đổi tên database/user) — **không cần cài MySQL lần 2**, một MySQL Server chạy chung nhiều
   database là bình thường và tiết kiệm RAM hơn nhiều so với mỗi project một container MySQL
   riêng.
3. Thêm entry mới vào `ecosystem.config.js` của project đó (cổng nội bộ khác, ví dụ 4000/4002
   để không đụng cổng của Comic Store), `pm2 start` + `pm2 save`.
4. Thêm 1 file cấu hình Nginx mới trong `/etc/nginx/sites-available/` (domain mới, các
   `location` trỏ tới cổng nội bộ mới — giống cấu trúc ở Phase 7), `ln -s` sang
   `sites-enabled`, `certbot --nginx -d ...` cho domain mới.

Không cần đụng vào cấu hình Nginx, PM2 app, hay database của Comic Store.

---

## 12. Bảng lệnh tra cứu nhanh

Chạy trong thư mục `~/comic-store` trừ khi ghi chú khác.

| Muốn làm gì | Lệnh |
| --- | --- |
| Xem trạng thái 2 process | `pm2 status` |
| Xem log 1 service, theo dõi live | `pm2 logs comic-backend` |
| Khởi động lại 1 service | `pm2 restart comic-backend` |
| Khởi động lại cả 2 service | `pm2 restart ecosystem.config.js` |
| Dừng 1 service (giữ lại trong danh sách PM2) | `pm2 stop comic-backend` |
| Build lại sau khi đổi code | `npm run build --prefix backend` (hoặc `frontend`) |
| Lưu danh sách process hiện tại cho PM2 startup | `pm2 save` |
| Xem log Nginx | `sudo tail -f /var/log/nginx/error.log` |
| Kiểm tra cú pháp + áp dụng cấu hình Nginx mới | `sudo nginx -t && sudo systemctl reload nginx` |
| Backup database thủ công | `mysqldump -u comic_user -p comic_store > backup.sql` |
| Đăng nhập MySQL | `mysql -u comic_user -p comic_store` |
| Xem dung lượng đĩa còn lại | `df -h` |
| Xem RAM đang dùng | `free -h` |
