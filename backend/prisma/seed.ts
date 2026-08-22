import { PrismaClient } from '@prisma/client';

// Prisma seed script — chạy độc lập ngoài Nest DI container (quy ước chuẩn
// của Prisma), nên dùng thẳng PrismaClient thay vì PrismaService của app.
const prisma = new PrismaClient();

const PAGES: Array<{
  slug: string;
  title: string;
  content: string;
  metaDescription: string;
}> = [
  {
    slug: 'gioi-thieu',
    title: 'Giới thiệu',
    content:
      'Chào mừng bạn đến với cửa hàng sách cũ của chúng tôi. Chúng tôi chuyên thu mua và bán lại sách cũ, truyện tranh với giá hợp lý, chất lượng được kiểm tra kỹ trước khi lên kệ. Nội dung này là placeholder, vui lòng chỉnh sửa lại cho phù hợp với câu chuyện thương hiệu của bạn.',
    metaDescription:
      'Giới thiệu về cửa hàng sách cũ — sứ mệnh, câu chuyện và cam kết chất lượng.',
  },
  {
    slug: 'giao-hang',
    title: 'Chính sách giao hàng',
    content:
      'Đơn hàng được đóng gói cẩn thận và giao qua đơn vị vận chuyển đối tác trong vòng 2-5 ngày làm việc tùy khu vực. Phí giao hàng được tính tự động khi đặt hàng. Vui lòng cập nhật lại nội dung này theo chính sách vận chuyển thực tế của shop.',
    metaDescription: 'Thời gian giao hàng, phí vận chuyển và khu vực áp dụng.',
  },
  {
    slug: 'thanh-toan',
    title: 'Chính sách thanh toán',
    content:
      'Chúng tôi hỗ trợ thanh toán chuyển khoản ngân hàng qua mã QR tự động, xác nhận thanh toán trong vài phút. Đơn hàng sẽ được xử lý ngay sau khi thanh toán thành công. Vui lòng thay nội dung này bằng chính sách thanh toán chính thức của shop.',
    metaDescription: 'Các phương thức thanh toán được hỗ trợ và quy trình xác nhận.',
  },
  {
    slug: 'doi-tra',
    title: 'Chính sách đổi trả',
    content:
      'Khách hàng có thể yêu cầu đổi trả trong vòng 3 ngày kể từ khi nhận hàng nếu sách bị lỗi, giao sai hoặc không đúng mô tả. Vui lòng giữ nguyên tình trạng sách và liên hệ shop để được hỗ trợ. Nội dung này cần được cập nhật theo chính sách thực tế.',
    metaDescription: 'Điều kiện và quy trình đổi trả sản phẩm.',
  },
  {
    slug: 'bao-mat',
    title: 'Chính sách bảo mật',
    content:
      'Chúng tôi cam kết bảo mật thông tin cá nhân của khách hàng, chỉ sử dụng cho mục đích xử lý đơn hàng và chăm sóc khách hàng, không chia sẻ cho bên thứ ba khi chưa có sự đồng ý. Vui lòng cập nhật nội dung này theo chính sách bảo mật đầy đủ của shop.',
    metaDescription: 'Cách chúng tôi thu thập, sử dụng và bảo vệ thông tin khách hàng.',
  },
  {
    slug: 'lien-he',
    title: 'Liên hệ',
    content:
      'Mọi thắc mắc vui lòng liên hệ qua hotline hoặc email của shop, chúng tôi sẽ phản hồi trong thời gian sớm nhất. Đây là nội dung placeholder, vui lòng cập nhật thông tin liên hệ thực tế (địa chỉ, số điện thoại, email, giờ làm việc).',
    metaDescription: 'Thông tin liên hệ: địa chỉ, hotline, email và giờ làm việc.',
  },
];

// Banner.imageUrl là bắt buộc và phải trỏ tới một file ảnh thật đã upload —
// không có ảnh mẫu nào sẵn có trong repo nên seed KHÔNG tự tạo banner giả
// (một imageUrl trỏ tới file không tồn tại sẽ hiển thị ảnh vỡ trên trang
// chủ). Trang chủ đã có sẵn trạng thái rỗng phù hợp khi chưa có banner nào;
// chủ shop tạo banner thật qua /admin/banners (có upload ảnh thật).

const POSTS: Array<{
  slug: string;
  title: string;
  excerpt: string;
  content: string;
}> = [
  {
    slug: 'kinh-nghiem-chon-mua-sach-cu',
    title: 'Kinh nghiệm chọn mua sách cũ chất lượng',
    excerpt:
      'Một vài lưu ý giúp bạn chọn được cuốn sách cũ còn tốt, tránh mua phải sách ẩm mốc hoặc thiếu trang.',
    content:
      'Khi mua sách cũ, bạn nên kiểm tra kỹ tình trạng gáy sách, các trang có bị ố vàng, ẩm mốc hay thiếu trang hay không. Ngoài ra nên ưu tiên những shop có mô tả tình trạng sách rõ ràng và ảnh chụp thật. Đây là bài viết mẫu, vui lòng thay bằng nội dung blog thực tế của shop.',
  },
  {
    slug: 'loi-ich-cua-viec-doc-sach-moi-ngay',
    title: 'Lợi ích của việc đọc sách mỗi ngày',
    excerpt:
      'Duy trì thói quen đọc sách mỗi ngày mang lại nhiều lợi ích cho tư duy và tinh thần.',
    content:
      'Đọc sách đều đặn giúp mở rộng vốn từ, cải thiện khả năng tập trung và giảm căng thẳng. Việc lựa chọn sách cũ với giá hợp lý cũng là cách tuyệt vời để xây dựng tủ sách cá nhân mà không tốn quá nhiều chi phí. Đây là bài viết mẫu, vui lòng thay bằng nội dung blog thực tế của shop.',
  },
];

async function main() {
  for (const page of PAGES) {
    await prisma.page.upsert({
      where: { slug: page.slug },
      update: {
        title: page.title,
        content: page.content,
        metaDescription: page.metaDescription,
        isActive: true,
      },
      create: {
        slug: page.slug,
        title: page.title,
        content: page.content,
        metaDescription: page.metaDescription,
        isActive: true,
      },
    });
  }
  console.log(`Seeded ${PAGES.length} pages.`);

  // Post.authorId là FK optional — không có cơ chế nào tự tạo admin user mặc
  // định (register() tạo user role CUSTOMER thông thường), nên tra một User
  // bất kỳ đã tồn tại để gắn làm tác giả; nếu chưa có User nào thì vẫn tạo
  // bài viết với authorId = null (schema cho phép) thay vì tự bịa user giả.
  const anyUser = await prisma.user.findFirst({ orderBy: { id: 'asc' } });
  if (!anyUser) {
    console.log(
      'Không tìm thấy User nào trong DB — tạo bài viết mẫu với authorId = null.',
    );
  }

  for (const post of POSTS) {
    await prisma.post.upsert({
      where: { slug: post.slug },
      update: {
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        authorId: anyUser ? anyUser.id : null,
      },
      create: {
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        authorId: anyUser ? anyUser.id : null,
      },
    });
  }
  console.log(`Seeded ${POSTS.length} posts.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
