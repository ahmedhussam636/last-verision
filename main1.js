// دالة تحميل مكتبات خارجية
function loadScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = url;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// تهيئة التطبيق
async function initializeApp() {
  try {
    // تحميل المكتبات المطلوبة
    await Promise.all([
      loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"),
      loadScript("https://html2canvas.hertzen.com/dist/html2canvas.min.js"),
    ]);

    // تهيئة الخدمات الأساسية
    setupServiceWorker();
    setupDarkMode();
    setupEventListeners();
    setupInitialState();
  } catch (error) {
    console.error("Initialization error:", error);
  }
}

// تسجيل Service Worker
function setupServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => console.log("ServiceWorker registered"))
      .catch((err) => console.error("ServiceWorker registration failed:", err));
  }
}

// إعداد الوضع الداكن
function setupDarkMode() {
  const toggleDarkMode = () => {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem("darkMode", document.body.classList.contains("dark-mode"));

    const icon = document.querySelector(".mode-toggle-btn img");
    icon.src = document.body.classList.contains("dark-mode")
      ? "https://cdn-icons-png.flaticon.com/128/6853/6853926.png"
      : "https://cdn-icons-png.flaticon.com/128/3688/3688596.png";
  };

  document.querySelector(".mode-toggle-btn").addEventListener("click", toggleDarkMode);

  // تحميل الوضع المفضل
  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark-mode");
    document.querySelector(".mode-toggle-btn img").src = "https://cdn-icons-png.flaticon.com/128/6853/6853926.png";
  }
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
  try {
    // نسخ المقال
    const copyBtn = document.getElementById("copyArticleBtn");
    if (copyBtn) {
      copyBtn.addEventListener("click", copyArticleText);
    }

    // المشاركة الاجتماعية
    document.querySelectorAll('[onclick^="shareSocial"]').forEach((btn) => {
      const platform = btn.getAttribute("onclick").match(/'([^']+)'/)[1];
      btn.addEventListener("click", () => {
        shareSocial(platform);
        trackShareEvent(platform);
      });
    });

    // ⭐ التقييم
    const stars = document.querySelectorAll(".star");
    if (stars.length > 0) {
      const highlightStars = (num) => {
        stars.forEach((star, index) => {
          star.classList.toggle("highlighted", index < num);
        });
      };

      const resetStars = () => stars.forEach((star) => star.classList.remove("highlighted"));

      stars.forEach((star, index) => {
        // تأثير عند وضع المؤشر
        star.addEventListener("mouseenter", () => highlightStars(index + 1));
        // إعادة النجوم إلى حالتها الأصلية عند إزالة المؤشر
        star.addEventListener("mouseleave", resetStars);
        // النقر على النجم
        star.addEventListener("click", () => {
          const currentRating = getUserRating();
          if (currentRating === index + 1) {
            // إذا تم النقر على نفس التقييم، نعرض خيار إلغاء التقييم
            if (confirm("هل تريد إلغاء تقييمك للمقال؟")) removeRating();
          } else {
            // تحديث التقييم
            updateRating(index + 1);
          }
        });
      });
    }

    // البحث
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
      searchInput.addEventListener("input", debounce(() => {}, 300));
    }

    // العودة للأعلى
    const backToTopBtn = document.getElementById("backToTop");
    if (backToTopBtn) {
      backToTopBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    }

    // القراءة الصوتية
    const ttsBtn = document.getElementById("ttsBtn");
    if (ttsBtn) {
      if ("speechSynthesis" in window) {
        ttsBtn.addEventListener("click", toggleSpeech);
        ttsBtn.style.display = "block";
      } else {
        ttsBtn.style.display = "none";
      }
    }

    // الإشارات المرجعية
    const bookmarkBtn = document.getElementById("bookmarkBtn");
    if (bookmarkBtn) {
      bookmarkBtn.addEventListener("click", () => {});
    }
  } catch (error) {
    console.error("Error in setupEventListeners:", error);
  }
}

// تهيئة الحالة الأولية
function setupInitialState() {
  document.body.classList.add("loaded");
  calculateReadingTime();
  updateViewCount();
  setupLazyLoading();
  setupBackToTop();
  loadArticleRating();
  setupBookmarking();
  initArticleSearch();
}

// دالة مساعدة للتأخير
function debounce(func, delay) {
  let timeout;
  return function () {
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

// ===== الوظائف الرئيسية =====

// عرض تنبيه النسخ
function showCopyAlert(message, type = "success") {
  const alert = document.getElementById("copyAlert");
  if (alert) {
    alert.textContent = message;
    alert.className = `copy-alert alert alert-${type === "error" ? "danger" : "success"}`;
    alert.style.display = "block";

    setTimeout(() => {
      alert.style.display = "none";
    }, 3000);
  }
}

// المشاركة على المنصات
function shareSocial(platform) {
  const url = encodeURIComponent(window.location.href);
  const text = encodeURIComponent("اقرأ هذا المقال المفيد: " + document.title);

  let shareUrl = "";
  switch (platform) {
    case "whatsapp": shareUrl = `https://wa.me/?text=${text} ${url}`; break;
    case "telegram": shareUrl = `https://t.me/share/url?url=${url}&text=${text}`; break;
    case "facebook": shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`; break;
    case "twitter": shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`; break;
  }
  window.open(shareUrl, "_blank", "width=600,height=400");
}

// تتبع المشاركة
function trackShareEvent(platform) {
  if (window.gtag) {
    window.gtag("event", "share", { event_category: "social", event_label: platform });
  }
}

// حساب وقت القراءة
function calculateReadingTime() {
  const readingTimeElement = document.getElementById("reading-time");
  const articleContent = document.querySelector(".article-content");
  if (readingTimeElement && articleContent) {
    const text = articleContent.innerText;
    const wordsPerMinute = 200;
    const wordCount = text.split(/\s+/).length;
    readingTimeElement.textContent = `${Math.ceil(wordCount / wordsPerMinute)} دقائق قراءة`;
  }
}

// تحديث عدد المشاهدات
function updateViewCount() {
  const viewCountElement = document.getElementById("view-count");
  if (viewCountElement) {
    let currentViews = localStorage.getItem("articleViews") || Math.floor(Math.random() * 2000) + 500;
    currentViews = parseInt(currentViews) + 1;
    viewCountElement.textContent = `${currentViews.toLocaleString("ar-SA")} مشاهدة`;
    localStorage.setItem("articleViews", currentViews);
  }
}

// تحميل التقييمات من التخزين المحلي
function loadArticleRating() {
  try {
    const articleId = window.location.pathname;
    const ratings = JSON.parse(localStorage.getItem("articleRatings") || "{}");
    const userRatings = JSON.parse(localStorage.getItem("userRatings") || "{}");

    if (ratings[articleId]) {
      const avgRating = (ratings[articleId].total / ratings[articleId].count).toFixed(1);
      const ratingResult = document.getElementById("ratingResult");
      if (ratingResult) {
        ratingResult.textContent = `التقييم: ${avgRating} (${ratings[articleId].count} تقييمات)`;
        ratingResult.style.display = "block";
      }
      if (userRatings[articleId] !== undefined) highlightStars(userRatings[articleId]);
    }
  } catch (error) {
    console.error("Error in loadArticleRating:", error);
  }
}

// الحصول على تقييم المستخدم الحالي
function getUserRating() {
  const articleId = window.location.pathname;
  const userRatings = JSON.parse(localStorage.getItem("userRatings") || "{}");
  return userRatings[articleId];
}

// تحديث التقييم
function updateRating(newRating) {
  try {
    const articleId = window.location.pathname;
    const ratings = JSON.parse(localStorage.getItem("articleRatings") || "{}");
    const userRatings = JSON.parse(localStorage.getItem("userRatings") || "{}");
    const oldRating = userRatings[articleId];

    if (!ratings[articleId]) ratings[articleId] = { total: 0, count: 0 };
    if (oldRating !== undefined) ratings[articleId].total -= oldRating;
    else ratings[articleId].count++;

    ratings[articleId].total += newRating;
    userRatings[articleId] = newRating;

    localStorage.setItem("articleRatings", JSON.stringify(ratings));
    localStorage.setItem("userRatings", JSON.stringify(userRatings));

    const avgRating = (ratings[articleId].total / ratings[articleId].count).toFixed(1);
    const ratingResult = document.getElementById("ratingResult");
    if (ratingResult) {
      ratingResult.textContent = `التقييم: ${avgRating} (${ratings[articleId].count} تقييمات)`;
      ratingResult.style.display = "block";
    }

    highlightStars(newRating);
    showCopyAlert(oldRating ? "تم تحديث تقييمك للمقال" : "شكراً لتقييمك للمقال");
  } catch (error) {
    console.error("Error in updateRating:", error);
    showCopyAlert("حدث خطأ أثناء تحديث التقييم", "error");
  }
}

// إلغاء التقييم
function removeRating() {
  try {
    const articleId = window.location.pathname;
    const ratings = JSON.parse(localStorage.getItem("articleRatings") || "{}");
    const userRatings = JSON.parse(localStorage.getItem("userRatings") || "{}");
    const oldRating = userRatings[articleId];

    if (oldRating !== undefined) {
      ratings[articleId].total -= oldRating;
      ratings[articleId].count--;
      delete userRatings[articleId];

      localStorage.setItem("articleRatings", JSON.stringify(ratings));
      localStorage.setItem("userRatings", JSON.stringify(userRatings));

      const ratingResult = document.getElementById("ratingResult");
      if (ratings[articleId].count > 0) {
        const avgRating = (ratings[articleId].total / ratings[articleId].count).toFixed(1);
        ratingResult.textContent = `التقييم: ${avgRating} (${ratings[articleId].count} تقييمات)`;
      } else {
        ratingResult.textContent = "لا توجد تقييمات بعد";
      }
      ratingResult.style.display = "block";

      resetStars();
      showCopyAlert("تم إلغاء تقييمك للمقال");
    }
  } catch (error) {
    console.error("Error in removeRating:", error);
    showCopyAlert("حدث خطأ أثناء إلغاء التقييم", "error");
  }
}

// دالة نسخ النص
document.addEventListener("DOMContentLoaded", () => {
  const copyArticleBtn = document.getElementById("copyArticleBtn");
  const copyAlert = document.getElementById("copyAlert");

  if (copyArticleBtn && copyAlert) {
    copyArticleBtn.addEventListener("click", () => {
      const articleContent = document.getElementById("article-content");
      if (articleContent) {
        navigator.clipboard.writeText(articleContent.innerText)
          .then(() => {
            copyAlert.style.display = "block";
            setTimeout(() => copyAlert.style.display = "none", 3000);
          })
          .catch(() => alert("فشل نسخ النص. يرجى المحاولة مرة أخرى."));
      }
    });
  }
});

// دوال إضافية
function setupLazyLoading() {} // تحميل بطيء
function setupBackToTop() {} // العودة للأعلى
function setupBookmarking() {} // الإشارات المرجعية
function initArticleSearch() {} // البحث
function highlightStars(num) {
  document.querySelectorAll(".star").forEach((star, index) => {
    star.classList.toggle("highlighted", index < num);
  });
}
function resetStars() {
  document.querySelectorAll(".star").forEach((star) => star.classList.remove("highlighted"));
}
function toggleSpeech() {} // تبديل القراءة الصوتية
