let currentCurrency = 'USD';
let exchangeRates = {
    USD: 1,
    EUR: 0.85,
    GBP: 0.73,
};

// Fetch live exchange rates
async function fetchExchangeRates() {
    try {
        const response = await fetch(
            'https://api.exchangerate-api.com/v4/latest/USD'
        );
        const data = await response.json();
        exchangeRates = {
            USD: 1,
            EUR: data.rates.EUR,
            GBP: data.rates.GBP,
        };
    } catch (error) {
        console.log(
            'Using default exchange rates'
        );
    }
}

fetchExchangeRates();

// Currency conversion
function convertPrice(usdPrice) {
    const convertedPrice =
        usdPrice *
        exchangeRates[currentCurrency];
    const symbol =
        currentCurrency === 'USD'
            ? '$'
            : currentCurrency === 'EUR'
                ? '€'
                : '£';
    return `${symbol}${Math.round(
        convertedPrice
    )}`;
}

// Convert USD discount to current currency
function convertDiscount(usdDiscount) {
    const convertedDiscount =
        usdDiscount *
        exchangeRates[currentCurrency];
    const symbol =
        currentCurrency === 'USD'
            ? '$'
            : currentCurrency === 'EUR'
                ? '€'
                : '£';
    return `${symbol}${Math.round(
        convertedDiscount
    )}`;
}

// Page navigation function
function navigateToPage(pageName) {
    // Hide all pages
    document
        .querySelectorAll('.page-content')
        .forEach((page) => {
            page.classList.remove('active');
        });

    // Show selected page
    const targetPage =
        document.getElementById(pageName);
    if (targetPage) {
        targetPage.classList.add('active');
    }

    // Update nav links
    document
        .querySelectorAll('.nav-link')
        .forEach((link) => {
            link.classList.remove('active');
            if (link.dataset.page === pageName) {
                link.classList.add('active');
            }
        });

    // Close mobile menu
    document
        .getElementById('navMenu')
        .classList.remove('active');

    // Scroll to top
    window.scrollTo(0, 0);
}

// Initialize service options when page loads
let serviceOptions = {
    fut: {
        platform: 'playstation',
        delivery: 'normal',
        payment: 'paypal',
    },
    div: {
        platform: 'playstation',
        delivery: 'normal',
        payment: 'paypal',
    },
    draft: {
        platform: 'playstation',
        delivery: 'normal',
        payment: 'paypal',
    },
    friendly: {
        platform: 'playstation',
        delivery: 'normal',
        payment: 'paypal',
    },
    squad: {
        platform: 'playstation',
        delivery: 'normal',
        payment: 'paypal',
    },
};

// Promo Code Functionality
let appliedPromos = {};

async function applyPromoCode(service) {
    const input = document.getElementById(
        `${service}-promo-code`
    );
    const message = document.getElementById(
        `${service}-promo-message`
    );
    const button = input.nextElementSibling;
    const code = input.value
        .trim()
        .toUpperCase();

    if (!code) {
        showPromoMessage(
            message,
            'Please enter a promo code',
            'error'
        );
        return;
    }

    button.disabled = true;
    button.textContent = 'Checking...';
    showPromoMessage(
        message,
        'Validating promo code...',
        'loading'
    );

    try {
        const response = await fetch(
            `https://script.google.com/macros/s/AKfycbxNOy_OULZAOj-yLbNj8YTmO88EjTGgtmnHHf3_km3FkTOV2L7zEwLPVOUhiCPdR21s/exec?code=${encodeURIComponent(
                code
            )}&service=${service.toUpperCase()}`
        );

        const data = await response.json();

        if (data.success) {
            // حفظ البرومو كود (دائماً بالدولار من Google Sheets)
            appliedPromos[service] = {
                code: code,
                type: data.type,
                value: data.value, // هذا بالدولار دائماً
                discount: data.discount,
            };

            // عرض الرسالة بالعملة الحالية
            const discountInCurrentCurrency =
                convertDiscount(data.value);
            showPromoMessage(
                message,
                `✅ Promo code applied! You saved ${discountInCurrentCurrency}`,
                'success'
            );
            input.disabled = true;
            button.textContent = 'Applied';

            // إعادة حساب السعر فوراً
            if (service === 'fut')
                updateFutPrice();
            if (service === 'div')
                updateDivPrice();
            if (service === 'draft')
                updateDraftPrice();
        } else {
            showPromoMessage(
                message,
                data.message ||
                'Invalid promo code',
                'error'
            );
            button.disabled = false;
            button.textContent = 'Apply';
        }
    } catch (error) {
        console.error(
            'Promo code error:',
            error
        );
        showPromoMessage(
            message,
            'Error validating promo code. Please try again.',
            'error'
        );
        button.disabled = false;
        button.textContent = 'Apply';
    }
}

function showPromoMessage(
    messageEl,
    text,
    type
) {
    messageEl.textContent = text;
    messageEl.className = `promo-message ${type}`;
    messageEl.style.display = 'block';
}

// تطبيق الخصم (بالدولار أولاً ثم تحويل العملة)
function applyDiscount(
    originalPriceUSD,
    service
) {
    if (appliedPromos[service]) {
        const promo = appliedPromos[service];
        let discountedPriceUSD;

        if (promo.type === 'percentage') {
            discountedPriceUSD = Math.round(
                originalPriceUSD *
                (1 - promo.value / 100)
            );
        } else if (promo.type === 'fixed') {
            discountedPriceUSD = Math.max(
                0,
                originalPriceUSD - promo.value
            );
        } else {
            discountedPriceUSD = originalPriceUSD;
        }

        return discountedPriceUSD;
    }
    return originalPriceUSD;
}

// Navigation functionality
document.addEventListener(
    'DOMContentLoaded',
    function () {
        // Navigation links
        document
            .querySelectorAll('.nav-link')
            .forEach((link) => {
                link.addEventListener(
                    'click',
                    function (e) {
                        e.preventDefault();
                        const targetPage =
                            this.dataset.page;
                        if (targetPage) {
                            navigateToPage(targetPage);
                        }
                    }
                );
            });

        // Mobile menu toggle
        document
            .getElementById('mobileMenuBtn')
            .addEventListener(
                'click',
                function (e) {
                    e.preventDefault();
                    document
                        .getElementById('navMenu')
                        .classList.toggle('active');
                }
            );

        // Close mobile menu when clicking outside
        document.addEventListener(
            'click',
            function (e) {
                const navMenu =
                    document.getElementById(
                        'navMenu'
                    );
                const mobileMenuBtn =
                    document.getElementById(
                        'mobileMenuBtn'
                    );

                if (
                    !navMenu.contains(e.target) &&
                    !mobileMenuBtn.contains(e.target)
                ) {
                    navMenu.classList.remove(
                        'active'
                    );
                }
            }
        );

        // Initialize services
        initFutChampions();
        initDivisionRivals();
        initOnlineDraft();
    }
);

// FAQ functionality
function toggleFaq(element) {
    const answer = element.nextElementSibling;
    const icon = element.querySelector('i');

    answer.classList.toggle('active');

    if (answer.classList.contains('active')) {
        icon.classList.remove('fa-plus');
        icon.classList.add('fa-minus');
    } else {
        icon.classList.remove('fa-minus');
        icon.classList.add('fa-plus');
    }
}

// Currency selector functionality
document
    .querySelectorAll('.currency-btn')
    .forEach((btn) => {
        btn.addEventListener(
            'click',
            function () {
                document
                    .querySelectorAll('.currency-btn')
                    .forEach((b) =>
                        b.classList.remove('active')
                    );
                this.classList.add('active');
                currentCurrency =
                    this.dataset.currency;

                // إعادة حساب كل الأسعار والبرومو عند تغيير العملة
                updateFutPrice();
                updateDivPrice();
                updateDraftPrice();

                // تحديث رسائل البرومو المطبقة
                updatePromoMessages();
            }
        );
    });

// تحديث رسائل البرومو عند تغيير العملة
function updatePromoMessages() {
    ['fut', 'div', 'draft'].forEach(
        (service) => {
            if (appliedPromos[service]) {
                const message =
                    document.getElementById(
                        `${service}-promo-message`
                    );
                const discountInCurrentCurrency =
                    convertDiscount(
                        appliedPromos[service].value
                    );
                showPromoMessage(
                    message,
                    `✅ Promo code applied! You saved ${discountInCurrentCurrency}`,
                    'success'
                );
            }
        }
    );
}

// Service tabs functionality
document.addEventListener(
    'click',
    function (e) {
        if (
            e.target.classList.contains('tab') &&
            !e.target.classList.contains(
                'disabled'
            )
        ) {
            document
                .querySelectorAll('.tab')
                .forEach((t) =>
                    t.classList.remove('active')
                );
            document
                .querySelectorAll(
                    '.service-content'
                )
                .forEach((c) =>
                    c.classList.remove('active')
                );

            e.target.classList.add('active');
            document
                .getElementById(
                    e.target.dataset.service
                )
                .classList.add('active');
        }
    }
);

// Button selection functionality
document.addEventListener(
    'click',
    function (e) {
        if (
            e.target.classList.contains(
                'select-btn'
            )
        ) {
            const service =
                e.target.dataset.service;
            const option =
                e.target.dataset.option;
            const isDelivery =
                option === 'normal' ||
                option === 'express';
            const isPayment =
                option === 'paypal' ||
                option === 'payoneer';
            const isPlatform =
                option === 'playstation' ||
                option === 'xbox';

            // Update button states (make clicked button green)
            const buttonGroup =
                e.target.parentElement;
            buttonGroup
                .querySelectorAll('.select-btn')
                .forEach((btn) =>
                    btn.classList.remove('active')
                );
            e.target.classList.add('active');

            // Update service options
            if (isPlatform) {
                serviceOptions[service].platform =
                    option;
            } else if (isDelivery) {
                serviceOptions[service].delivery =
                    option;
            } else if (isPayment) {
                serviceOptions[service].payment =
                    option;
            }

            // Update prices based on service
            if (service === 'fut')
                updateFutPrice();
            if (service === 'div')
                updateDivPrice();
            if (service === 'draft')
                updateDraftPrice();
        }
    }
);

// FUT Champions Logic
function initFutChampions() {
    const winsSelect =
        document.getElementById(
            'fut-current-wins'
        );
    const losesSelect =
        document.getElementById(
            'fut-current-loses'
        );
    const rankSelect =
        document.getElementById(
            'fut-required-rank'
        );

    // Clear existing options
    winsSelect.innerHTML =
        '<option value="">Select Current Wins</option>';
    losesSelect.innerHTML =
        '<option value="">Select Current Loses</option>';

    for (let i = 0; i <= 15; i++) {
        winsSelect.innerHTML += `<option value="${i}">${i}</option>`;
        losesSelect.innerHTML += `<option value="${i}">${i}</option>`;
    }

    function updateAvailableRanks() {
        const loses =
            parseInt(losesSelect.value) || 0;
        const ranks = [
            'Rank 1',
            'Rank 2',
            'Rank 3',
            'Rank 4',
            'Rank 5',
            'Rank 6',
            'Rank 7',
        ];
        const prices = [
            100, 90, 80, 70, 60, 50, 40,
        ];

        rankSelect.innerHTML =
            '<option value="">Select Required Rank</option>';

        for (
            let i = loses;
            i < ranks.length;
            i++
        ) {
            const price = prices[i - loses];
            rankSelect.innerHTML += `<option value="${price}" data-rank="${ranks[i]}">${ranks[i]}</option>`;
        }

        updateFutPrice();
    }

    losesSelect.addEventListener(
        'change',
        updateAvailableRanks
    );
    winsSelect.addEventListener(
        'change',
        updateFutPrice
    );
    rankSelect.addEventListener(
        'change',
        updateFutPrice
    );
}

function updateFutPrice() {
    const wins = document.getElementById(
        'fut-current-wins'
    ).value;
    const loses = document.getElementById(
        'fut-current-loses'
    ).value;
    const rankOption =
        document.getElementById(
            'fut-required-rank'
        ).selectedOptions[0];

    if (
        wins &&
        loses &&
        rankOption &&
        rankOption.value
    ) {
        let originalPriceUSD = parseInt(
            rankOption.value
        );
        const rankName =
            rankOption.dataset.rank;

        // Add Xbox platform cost (in USD)
        if (
            serviceOptions.fut &&
            serviceOptions.fut.platform === 'xbox'
        ) {
            originalPriceUSD += 10;
        }

        // Add express delivery cost (in USD)
        if (
            serviceOptions.fut &&
            serviceOptions.fut.delivery ===
            'express'
        ) {
            originalPriceUSD += 13;
        }

        // تطبيق الخصم (بالدولار)
        const finalPriceUSD = applyDiscount(
            originalPriceUSD,
            'fut'
        );

        // تحويل السعر النهائي للعملة الحالية
        const finalPriceConverted =
            convertPrice(finalPriceUSD);

        // تحديث السعر الأخضر
        document.getElementById(
            'fut-price-amount'
        ).textContent = finalPriceConverted;
        document.getElementById(
            'fut-currency'
        ).textContent = currentCurrency;
        document.getElementById(
            'fut-price'
        ).style.display = 'block';
        document.getElementById(
            'fut-promo-section'
        ).style.display = 'block';

        const deliveryText =
            serviceOptions.fut &&
                serviceOptions.fut.delivery ===
                'express'
                ? 'Express (+$13)'
                : 'Normal';
        const paymentText =
            serviceOptions.fut &&
                serviceOptions.fut.payment
                ? serviceOptions.fut.payment
                : 'paypal';

        let summaryContent = `
                    <div class="summary-item"><span>Service:</span><span>FUT Champions</span></div>
                    <div class="summary-item"><span>Current Record:</span><span>${wins}W - ${loses}L</span></div>
                    <div class="summary-item"><span>Target Rank:</span><span>${rankName}</span></div>
                    <div class="summary-item"><span>Platform:</span><span>${serviceOptions.fut
                .platform === 'xbox'
                ? 'Xbox (+$10)'
                : 'PlayStation'
            }</span></div>
                    <div class="summary-item"><span>Delivery:</span><span>${deliveryText}</span></div>
                    <div class="summary-item"><span>Payment:</span><span>${paymentText}</span></div>`;

        // إضافة الـ Promo فقط لو موجود
        if (appliedPromos.fut) {
            const savedAmountUSD =
                originalPriceUSD - finalPriceUSD;
            const savedAmountConverted =
                convertDiscount(savedAmountUSD);
            summaryContent += `<div class="summary-item"><span>Promo Code:</span><span style="color: #28a745;">${appliedPromos.fut.code} (-${savedAmountConverted})</span></div>`;
        }

        summaryContent += `<div class="summary-item"><span>Final Price:</span><span>${finalPriceConverted}</span></div>`;

        document.getElementById(
            'fut-summary-content'
        ).innerHTML = summaryContent;
        document.getElementById(
            'fut-summary'
        ).style.display = 'block';

        const orderBtn =
            document.getElementById(
                'fut-order-btn'
            );
        orderBtn.disabled = false;
        orderBtn.textContent = 'Order Now';
        orderBtn.onclick = () =>
            orderFutChampions(
                wins,
                loses,
                rankName,
                finalPriceConverted
            );
    } else {
        document.getElementById(
            'fut-price'
        ).style.display = 'none';
        document.getElementById(
            'fut-promo-section'
        ).style.display = 'none';
        document.getElementById(
            'fut-summary'
        ).style.display = 'none';
        document.getElementById(
            'fut-order-btn'
        ).disabled = true;
        document.getElementById(
            'fut-order-btn'
        ).textContent =
            'Select all options first';
    }
}

function orderFutChampions(
    wins,
    loses,
    rank,
    price
) {
    if (!validateEmail('fut')) return;
    const email =
        document.getElementById('fut-email')
            .value || 'Not provided';
    const deliveryText =
        serviceOptions.fut &&
            serviceOptions.fut.delivery ===
            'express'
            ? 'Express'
            : 'Normal';
    const paymentText =
        serviceOptions.fut &&
            serviceOptions.fut.payment
            ? serviceOptions.fut.payment
            : 'paypal';

    let message = `🎮 QBoosting Order

Service: FUT Champions
Current Record: ${wins}W - ${loses}L
Target Rank: ${rank}
Platform: ${serviceOptions.fut.platform === 'xbox'
            ? 'Xbox (+$10)'
            : 'PlayStation'
        }
Delivery: ${deliveryText}
Payment Method: ${paymentText}
Email: ${email}`;

    // إضافة الـ Promo لو موجود
    if (appliedPromos.fut) {
        message += `\nPromo Code: ${appliedPromos.fut.code} ✅`;
    }

    message += `\nFinal Price: ${price}

Ready to start when you confirm! 🚀`;

    window.open(
        `https://t.me/QBoostingHelp?text=${encodeURIComponent(
            message
        )}`,
        '_blank'
    );
}

// Division Rivals Logic
function initDivisionRivals() {
    const currentSelect =
        document.getElementById('div-current');
    const requiredSelect =
        document.getElementById('div-required');

    currentSelect.addEventListener(
        'change',
        updateRequiredDivisions
    );
    requiredSelect.addEventListener(
        'change',
        updateDivPrice
    );
}

function updateRequiredDivisions() {
    const current = parseInt(
        document.getElementById('div-current')
            .value
    );
    const requiredSelect =
        document.getElementById('div-required');

    requiredSelect.innerHTML =
        '<option value="">Select Required Division</option>';

    const divisions = [
        { value: 9, name: 'Division 9' },
        { value: 8, name: 'Division 8' },
        { value: 7, name: 'Division 7' },
        { value: 6, name: 'Division 6' },
        { value: 5, name: 'Division 5' },
        { value: 4, name: 'Division 4' },
        { value: 3, name: 'Division 3' },
        { value: 2, name: 'Division 2' },
        { value: 1, name: 'Division 1' },
        { value: 0, name: 'Elite Division' },
    ];

    divisions.forEach((div) => {
        if (div.value < current) {
            requiredSelect.innerHTML += `<option value="${div.value}">${div.name}</option>`;
        }
    });

    updateDivPrice();
}

function updateDivPrice() {
    const current = parseInt(
        document.getElementById('div-current')
            .value
    );
    const required = parseInt(
        document.getElementById('div-required')
            .value
    );

    if (
        current &&
        (required || required === 0)
    ) {
        const prices = {
            '10-9': 10,
            '9-8': 10,
            '8-7': 10,
            '7-6': 13,
            '6-5': 18,
            '5-4': 23,
            '4-3': 29,
            '3-2': 37,
            '2-1': 45,
            '1-0': 53,
        };

        let originalPriceUSD = 0;

        for (
            let i = current;
            i > required;
            i--
        ) {
            const key = `${i}-${i - 1}`;
            const stepPrice = prices[key];
            originalPriceUSD += stepPrice;
        }

        // Add Xbox platform cost (in USD)
        if (
            serviceOptions.div &&
            serviceOptions.div.platform === 'xbox'
        ) {
            originalPriceUSD += 10;
        }

        // Add express delivery cost (in USD)
        if (
            serviceOptions.div &&
            serviceOptions.div.delivery ===
            'express'
        ) {
            originalPriceUSD += 13;
        }

        // تطبيق الخصم (بالدولار)
        const finalPriceUSD = applyDiscount(
            originalPriceUSD,
            'div'
        );

        // تحويل السعر النهائي للعملة الحالية
        const finalPriceConverted =
            convertPrice(finalPriceUSD);

        // تحديث السعر الأخضر
        document.getElementById(
            'div-price-amount'
        ).textContent = finalPriceConverted;
        document.getElementById(
            'div-currency'
        ).textContent = currentCurrency;
        document.getElementById(
            'div-price'
        ).style.display = 'block';
        document.getElementById(
            'div-promo-section'
        ).style.display = 'block';

        const currentDivName =
            current === 0
                ? 'Elite Division'
                : `Division ${current}`;
        const requiredDivName =
            required === 0
                ? 'Elite Division'
                : `Division ${required}`;
        const deliveryText =
            serviceOptions.div &&
                serviceOptions.div.delivery ===
                'express'
                ? 'Express (+$13)'
                : 'Normal';
        const paymentText =
            serviceOptions.div &&
                serviceOptions.div.payment
                ? serviceOptions.div.payment
                : 'paypal';

        let summaryContent = `
                    <div class="summary-item"><span>Service:</span><span>Division Rivals</span></div>
                    <div class="summary-item"><span>From:</span><span>${currentDivName}</span></div>
                    <div class="summary-item"><span>To:</span><span>${requiredDivName}</span></div>
                    <div class="summary-item"><span>Platform:</span><span>${serviceOptions.div
                .platform === 'xbox'
                ? 'Xbox (+$10)'
                : 'PlayStation'
            }</span></div>
                    <div class="summary-item"><span>Delivery:</span><span>${deliveryText}</span></div>
                    <div class="summary-item"><span>Payment:</span><span>${paymentText}</span></div>`;

        // إضافة الـ Promo فقط لو موجود
        if (appliedPromos.div) {
            const savedAmountUSD =
                originalPriceUSD - finalPriceUSD;
            const savedAmountConverted =
                convertDiscount(savedAmountUSD);
            summaryContent += `<div class="summary-item"><span>Promo Code:</span><span style="color: #28a745;">${appliedPromos.div.code} (-${savedAmountConverted})</span></div>`;
        }

        summaryContent += `<div class="summary-item"><span>Final Price:</span><span>${finalPriceConverted}</span></div>`;

        document.getElementById(
            'div-summary-content'
        ).innerHTML = summaryContent;
        document.getElementById(
            'div-summary'
        ).style.display = 'block';

        const orderBtn =
            document.getElementById(
                'div-order-btn'
            );
        orderBtn.disabled = false;
        orderBtn.textContent = 'Order Now';
        orderBtn.onclick = () =>
            orderDivisionRivals(
                currentDivName,
                requiredDivName,
                finalPriceConverted
            );
    } else {
        document.getElementById(
            'div-price'
        ).style.display = 'none';
        document.getElementById(
            'div-promo-section'
        ).style.display = 'none';
        document.getElementById(
            'div-summary'
        ).style.display = 'none';
        document.getElementById(
            'div-order-btn'
        ).disabled = true;
        document.getElementById(
            'div-order-btn'
        ).textContent =
            'Select all options first';
    }
}

function orderDivisionRivals(
    current,
    required,
    price
) {
    if (!validateEmail('div')) return;
    const email =
        document.getElementById('div-email')
            .value || 'Not provided';
    const deliveryText =
        serviceOptions.div &&
            serviceOptions.div.delivery ===
            'express'
            ? 'Express'
            : 'Normal';
    const paymentText =
        serviceOptions.div &&
            serviceOptions.div.payment
            ? serviceOptions.div.payment
            : 'paypal';

    let message = `🎮 QBoosting Order

Service: Division Rivals
Current Division: ${current}
Target Division: ${required}
Platform: ${serviceOptions.div.platform === 'xbox'
            ? 'Xbox (+$10)'
            : 'PlayStation'
        }
Delivery: ${deliveryText}
Payment Method: ${paymentText}
Email: ${email}`;

    // إضافة الـ Promo لو موجود
    if (appliedPromos.div) {
        message += `\nPromo Code: ${appliedPromos.div.code} ✅`;
    }

    message += `\nFinal Price: ${price}

Ready to start when you confirm! 🚀`;

    window.open(
        `https://t.me/QBoostingHelp?text=${encodeURIComponent(
            message
        )}`,
        '_blank'
    );
}

// Online Draft Logic
function initOnlineDraft() {
    const winsSelect =
        document.getElementById('draft-wins');
    winsSelect.addEventListener(
        'change',
        updateDraftPrice
    );
}

function updateDraftPrice() {
    const wins = parseInt(
        document.getElementById('draft-wins')
            .value
    );

    if (wins) {
        const prices = {
            1: 8,
            2: 17,
            3: 27,
            4: 38,
        };
        let originalPriceUSD = prices[wins];

        // Add Xbox platform cost (in USD)
        if (
            serviceOptions.draft &&
            serviceOptions.draft.platform ===
            'xbox'
        ) {
            originalPriceUSD += 10;
        }

        // Add express delivery cost (in USD)
        if (
            serviceOptions.draft &&
            serviceOptions.draft.delivery ===
            'express'
        ) {
            originalPriceUSD += 13;
        }

        // تطبيق الخصم (بالدولار)
        const finalPriceUSD = applyDiscount(
            originalPriceUSD,
            'draft'
        );

        // تحويل السعر النهائي للعملة الحالية
        const finalPriceConverted =
            convertPrice(finalPriceUSD);

        // تحديث السعر الأخضر
        document.getElementById(
            'draft-price-amount'
        ).textContent = finalPriceConverted;
        document.getElementById(
            'draft-currency'
        ).textContent = currentCurrency;
        document.getElementById(
            'draft-price'
        ).style.display = 'block';
        document.getElementById(
            'draft-promo-section'
        ).style.display = 'block';

        const deliveryText =
            serviceOptions.draft &&
                serviceOptions.draft.delivery ===
                'express'
                ? 'Express (+$13)'
                : 'Normal';
        const paymentText =
            serviceOptions.draft &&
                serviceOptions.draft.payment
                ? serviceOptions.draft.payment
                : 'paypal';

        let summaryContent = `
                    <div class="summary-item"><span>Service:</span><span>Online Draft</span></div>
                    <div class="summary-item"><span>Required Wins:</span><span>${wins} Win${wins > 1 ? 's' : ''
            }</span></div>
                    <div class="summary-item"><span>Platform:</span><span>${serviceOptions.draft
                .platform === 'xbox'
                ? 'Xbox (+$10)'
                : 'PlayStation'
            }</span></div>
                    <div class="summary-item"><span>Delivery:</span><span>${deliveryText}</span></div>
                    <div class="summary-item"><span>Payment:</span><span>${paymentText}</span></div>`;

        // إضافة الـ Promo فقط لو موجود
        if (appliedPromos.draft) {
            const savedAmountUSD =
                originalPriceUSD - finalPriceUSD;
            const savedAmountConverted =
                convertDiscount(savedAmountUSD);
            summaryContent += `<div class="summary-item"><span>Promo Code:</span><span style="color: #28a745;">${appliedPromos.draft.code} (-${savedAmountConverted})</span></div>`;
        }

        summaryContent += `<div class="summary-item"><span>Final Price:</span><span>${finalPriceConverted}</span></div>`;

        document.getElementById(
            'draft-summary-content'
        ).innerHTML = summaryContent;
        document.getElementById(
            'draft-summary'
        ).style.display = 'block';

        const orderBtn =
            document.getElementById(
                'draft-order-btn'
            );
        orderBtn.disabled = false;
        orderBtn.textContent = 'Order Now';
        orderBtn.onclick = () =>
            orderOnlineDraft(
                wins,
                finalPriceConverted
            );
    } else {
        document.getElementById(
            'draft-price'
        ).style.display = 'none';
        document.getElementById(
            'draft-promo-section'
        ).style.display = 'none';
        document.getElementById(
            'draft-summary'
        ).style.display = 'none';
        document.getElementById(
            'draft-order-btn'
        ).disabled = true;
        document.getElementById(
            'draft-order-btn'
        ).textContent =
            'Select all options first';
    }
}

function orderOnlineDraft(wins, price) {
    if (!validateEmail('draft')) return;
    const email =
        document.getElementById('draft-email')
            .value || 'Not provided';
    const deliveryText =
        serviceOptions.draft &&
            serviceOptions.draft.delivery ===
            'express'
            ? 'Express'
            : 'Normal';
    const paymentText =
        serviceOptions.draft &&
            serviceOptions.draft.payment
            ? serviceOptions.draft.payment
            : 'paypal';

    let message = `🎮 QBoosting Order

Service: Online Draft
Required Wins: ${wins} Win${wins > 1 ? 's' : ''}
Platform: ${serviceOptions.draft.platform === 'xbox'
            ? 'Xbox (+$10)'
            : 'PlayStation'
        }
Delivery: ${deliveryText}
Payment Method: ${paymentText}
Email: ${email}`;

    // إضافة الـ Promo لو موجود
    if (appliedPromos.draft) {
        message += `\nPromo Code: ${appliedPromos.draft.code} ✅`;
    }

    message += `\nFinal Price: ${price}

⚠️ Important: Draft must be started fresh by our booster who will select the squad.

Ready to start when you confirm! 🚀`;

    window.open(
        `https://t.me/QBoostingHelp?text=${encodeURIComponent(
            message
        )}`,
        '_blank'
    );
}

function validateEmail(service) {
    const emailInput =
        document.getElementById(
            `${service}-email`
        );
    const email = emailInput.value.trim();

    if (!email) {
        emailInput.classList.add('error');
        emailInput.focus();
        return false;
    }

    emailInput.classList.remove('error');
    return true;
}

// Remove error styling when user starts typing
document
    .querySelectorAll('input[type="email"]')
    .forEach((input) => {
        input.addEventListener(
            'input',
            function () {
                this.classList.remove('error');
            }
        );
    });
document
    .querySelectorAll('.tooltip-container')
    .forEach(function (el) {
        el.addEventListener(
            'click',
            function (e) {
                e.stopPropagation();
                document
                    .querySelectorAll(
                        '.tooltip-container'
                    )
                    .forEach((t) =>
                        t.classList.remove('active')
                    );
                this.classList.add('active');
            }
        );
    });
document.addEventListener(
    'click',
    function () {
        document
            .querySelectorAll(
                '.tooltip-container'
            )
            .forEach((t) =>
                t.classList.remove('active')
            );
    }
);
