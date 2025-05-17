(function () {
  let debounceTimeout;
  const url_ = window.location.origin;

  const idkeyword =
    document.getElementById("keyword") ||
    document.getElementById("keyword-res");

  if (!idkeyword) {
    // Hoặc thực hiện hành động nào đó
    return;
  }

  idkeyword.style.borderRadius = "50px";

  idkeyword.addEventListener("input", function (event) {
    const currentEvent = event;
    clearTimeout(debounceTimeout); // Xóa bộ đếm trước đó nếu người dùng nhập liên tục

    debounceTimeout = setTimeout(function () {
      const keyword = currentEvent.target.value.trim();

      if (keyword) {
        // Tạo URL với từ khóa
        const url = `${url_}/tim-kiem?keyword=${encodeURIComponent(keyword)}`;

        // Gửi yêu cầu fetch
        fetch(url)
          .then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text(); // Trả về mã HTML dạng text
          })
          .then((html) => {
            // Parse HTML response thành DOM
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");
            const products = [];
            const productItems = doc.querySelectorAll(".product");

            productItems.forEach((item) => {
              const productName = item.querySelector(".product-name a")
                ? item.querySelector(".product-name a").textContent.trim()
                : null;
              const productPrice = item.querySelector(".price-new-m")
                ? item.querySelector(".price-new-m").textContent.trim()
                : null;
              const productImage = item.querySelector("picture source")
                ? item.querySelector("picture source").getAttribute("srcset")
                : null;
              const productUrl = item.querySelector(".position-relative")
                ? item.querySelector(".position-relative").getAttribute("href")
                : null;

              // Kiểm tra nếu không có data-src, sử dụng hình ảnh thay thế
              const finalImage =
                productImage ||
                `${url_}/thumbs/400x400x2/assets/images/noimage.webp.webp`;

              // Kiểm tra và thêm sản phẩm vào mảng nếu tất cả giá trị hợp lệ
              if (productName && productPrice && finalImage && productUrl) {
                products.push({
                  name: productName,
                  price: productPrice,
                  image: finalImage, // Sử dụng hình ảnh thay thế nếu không có data-src
                  url: productUrl, // Thêm URL vào mảng
                });
              }
            });

            // Gọi hàm hiển thị gợi ý danh sách sản phẩm
            displayProductSuggestions(products);
          })
          .catch((error) => {
            console.error("Error fetching data:", error); // Xử lý lỗi
          });
      } else {
        clearSuggestions(); // Nếu không có từ khóa, xóa danh sách gợi ý
      }
    }, 600); // Chờ 0.6 giây trước khi thực thi
  });

  // Hàm hiển thị gợi ý danh sách sản phẩm
  function displayProductSuggestions(products) {
    const searchForm =
      document.querySelector(".search") ||
      document.querySelector(".search-grid");
    searchForm.classList.add("relative");

    const input =
      searchForm.querySelector("#keyword") ||
      searchForm.querySelector("#keyword-res"); // Lấy input trong form

    // Tạo container cho gợi ý nếu chưa có
    let suggestionsContainer = searchForm.querySelector(
      "#suggestions-container"
    );

    if (!suggestionsContainer) {
      suggestionsContainer = document.createElement("div");
      suggestionsContainer.id = "suggestions-container";
      suggestionsContainer.style.position = "absolute";

      // Xác định vị trí bên dưới input
      suggestionsContainer.style.top = `${
        input.offsetTop + input.offsetHeight
      }px`;
      // suggestionsContainer.style.left = `${input.offsetLeft}px`;
      suggestionsContainer.style.width = `100%`;

      suggestionsContainer.style.maxHeight = "300px";
      suggestionsContainer.style.overflowY = "auto";
      suggestionsContainer.style.backgroundColor = "white";
      suggestionsContainer.style.zIndex = "999";
      suggestionsContainer.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
      suggestionsContainer.style.borderRadius = "5px";
      searchForm.appendChild(suggestionsContainer);
    }

    suggestionsContainer.innerHTML = ""; // Xóa tất cả gợi ý cũ

    // Duyệt qua danh sách sản phẩm và tạo các mục gợi ý
    products.forEach((product) => {
      const suggestionItem = document.createElement("div");
      suggestionItem.style.display = "flex";
      suggestionItem.style.padding = "10px";
      suggestionItem.style.cursor = "pointer";
      suggestionItem.style.borderBottom = "1px solid #ddd";
      suggestionItem.style.transition = "background-color 0.3s";

      suggestionItem.addEventListener("mouseenter", () => {
        suggestionItem.style.backgroundColor = "#f0f0f0"; // Đổi màu khi hover
      });
      suggestionItem.addEventListener("mouseleave", () => {
        suggestionItem.style.backgroundColor = ""; // Khôi phục màu khi rời chuột
      });

      const productImage = document.createElement("img");
      productImage.src = product.image;
      productImage.alt = product.name;
      productImage.style.width = "50px";
      productImage.style.height = "50px";
      productImage.style.marginRight = "10px";
      productImage.style.objectFit = "cover"; // Đảm bảo hình ảnh luôn đầy đủ

      const productInfo = document.createElement("div");
      productInfo.style.display = "flex";
      productInfo.style.flexDirection = "column";

      const productName = document.createElement("div");
      productName.textContent = product.name;
      productName.style.fontWeight = "bold";
      productName.style.marginBottom = "5px";

      const productPrice = document.createElement("div");
      productPrice.textContent = product.price;
      productPrice.style.color = "var(--color-main)";
      productPrice.style.fontSize = "14px";

      productInfo.appendChild(productName);
      productInfo.appendChild(productPrice);

      suggestionItem.appendChild(productImage);
      suggestionItem.appendChild(productInfo);

      // Thêm sự kiện khi nhấp vào một gợi ý
      suggestionItem.addEventListener("click", () => {
        window.location.href = product.url; // Chuyển hướng đến URL sản phẩm
      });

      suggestionsContainer.appendChild(suggestionItem);
    });

    document.addEventListener("click", (event) => {
      if (!searchForm.contains(event.target)) {
        clearSuggestions();
        document.getElementById("keyword").value = "";
      }
    });
  }

  // Hàm xóa tất cả gợi ý khi không có kết quả hoặc người dùng xóa từ khóa
  function clearSuggestions() {
    const suggestionsContainer = document.querySelector(
      "#suggestions-container"
    );
    if (suggestionsContainer) {
      suggestionsContainer.innerHTML = "";
    }
  }

  // Hàm hiển thị gợi ý danh sách sản phẩm
  document.querySelectorAll(".search-res, .search-grid").forEach((element) => {
    element.style.overflow = "unset";
  });

  // Hàm xóa tất cả gợi ý khi không có kết quả hoặc người dùng xóa từ khóa
  function clearSuggestions() {
    const suggestionsContainer = document.querySelector(
      "#suggestions-container"
    );
    if (suggestionsContainer) {
      suggestionsContainer.innerHTML = "";
    }
  }

  let spanElement = document.querySelector(".section-tiktok h2 span");
  if (spanElement) {
    spanElement.textContent = "KHUYẾN MÃI - BIG SALE";
  }

  let modalTitle = document.querySelector(".modal-title");

  if (modalTitle) {
    modalTitle.style.textAlign = "center";
    modalTitle.style.width = "100%";
    modalTitle.style.color = "var(--color-main)";
    modalTitle.style.fontSize = "20px";
    modalTitle.style.fontWeight = "bold";
    modalTitle.style.textTransform = "uppercase";
    modalTitle.classList.add("fa-bounce");
  }
  let menuRes = document.querySelector(".menu-res");

  if (menuRes) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 150) {
        // Khi cuộn xuống
        menuRes.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.6)";
      } else {
        // Khi ở đầu trang
        menuRes.style.boxShadow = "none";
      }
    });
  }

  const activeSpan = document.querySelector(".tab-pro span.active");
  if (activeSpan) {
    activeSpan.style.cursor = "grabbing";
  }

  const container = document.querySelector(".tab-pro");
  if (container) {
    let isDown = false;
    let startX;
    let scrollLeft;

    container.addEventListener("mousedown", (e) => {
      isDown = true;
      container.classList.add("active");
      startX = e.pageX - container.offsetLeft;
      scrollLeft = container.scrollLeft;
    });

    container.addEventListener("mouseleave", () => {
      isDown = false;
      container.classList.remove("active");
    });

    container.addEventListener("mouseup", () => {
      isDown = false;
      container.classList.remove("active");
    });

    container.addEventListener("mousemove", (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const walk = (x - startX) * 1.5;
      container.scrollLeft = scrollLeft - walk;
    });
  }
})();
