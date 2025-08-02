// تنفيذ وظيفة البحث

  document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById('searchBox');
    const articlesContainer = document.getElementById('articles-container');

    // إنشاء رسالة في حالة عدم وجود نتائج
    const noResultsMessage = document.createElement('div');
    noResultsMessage.className = 'text-center text-muted mt-4';
    noResultsMessage.style.display = 'none';
    noResultsMessage.textContent = 'لا توجد نتائج مطابقة';
    articlesContainer.parentNode.appendChild(noResultsMessage);

    function normalizeText(text) {
      return text
        .toLowerCase()
        .replace(/[إأآا]/g, "ا")
        .replace(/ى/g, "ي")
        .replace(/ؤ/g, "و")
        .replace(/ئ/g, "ي")
        .replace(/ة/g, "ه")
        .trim();
    }

    searchInput.addEventListener('input', function (e) {
      const searchTerm = normalizeText(e.target.value);
      const searchWords = searchTerm.split(/\s+/); // يدعم البحث بكلمات متعددة
      let visibleCount = 0;

      const articleCards = document.querySelectorAll('.card');
      articleCards.forEach(card => {
        const title = normalizeText(card.querySelector('.card-title').textContent);
        const excerpt = normalizeText(card.querySelector('.card-text').textContent);
        const articleCol = card.closest('.col-lg-4, .col-md-6');

        // تحقق إذا كانت كل الكلمات موجودة في العنوان أو النص
        const matches = searchWords.every(word =>
          title.includes(word) || excerpt.includes(word)
        );

        if (matches || searchTerm === "") {
          articleCol.style.display = 'block';
          visibleCount++;
        } else {
          articleCol.style.display = 'none';
        }
      });

      // إظهار أو إخفاء رسالة عدم وجود نتائج
      noResultsMessage.style.display = visibleCount === 0 ? 'block' : 'none';
    });
  });

