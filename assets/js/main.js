let currentCurrency = 'USD';
let exchangeRates = { USD: 1, EUR: 0.85, GBP: 0.73 };

// Order number tracking
let orderCounter = parseInt(localStorage.getItem('qboosting-order-counter') || '100');
let preGeneratedOrderNumbers = [];

let processingOrder = false;

// Function to get next order number (fallback)
function getLocalOrderNumber() {
    orderCounter++;
    localStorage.setItem('qboosting-order-counter', orderCounter.toString());
    return orderCounter;
}

// Pre-generate order numbers for faster response
async function preGenerateOrderNumbers() {
    try {
        // Increase to 10 order numbers for better coverage
        for (let i = 0; i < 10; i++) {
            const response = await fetch('https://script.google.com/macros/s/AKfycbzSnS76SnDykGZwXv99nehSwqJT_e4WQT_TpOVOtdYze-TkrMIWhtF0aBsvxhziw4Gm/exec?action=generateOrder');
            const data = await response.json();
            if (data.success) {
                preGeneratedOrderNumbers.push(data.orderNumber);
            }
        }
    } catch (error) {
        console.log('Could not pre-generate order numbers');
    }
}

// Modified getNextOrderNumber function
async function getNextOrderNumber() {
    // Use pre-generated number if available
    if (preGeneratedOrderNumbers.length > 0) {
        const orderNumber = preGeneratedOrderNumbers.shift();
        
        // Replenish the pool earlier when it gets to 5 instead of 2
        if (preGeneratedOrderNumbers.length < 5) {
            preGenerateOrderNumbers(); // Don't await this
        }
        
        return orderNumber;
    }
    
    // Fallback to original method
    try {
        const response = await fetch('https://script.google.com/macros/s/AKfycbzSnS76SnDykGZwXv99nehSwqJT_e4WQT_TpOVOtdYze-TkrMIWhtF0aBsvxhziw4Gm/exec?action=generateOrder');
        const data = await response.json();
        
        if (data.success) {
            return data.orderNumber;
        }
    } catch (error) {
        console.error('Failed to get order number:', error);
    }
    
    return getLocalOrderNumber();
}

// Optional: Log order to server for tracking
async function logOrderToServer(orderNumber, service, email, price) {
    try {
        const params = new URLSearchParams({
            action: 'logOrder',
            orderNumber: orderNumber,
            service: service,
            email: email,
            price: price
        });
        
        await fetch(`https://script.google.com/macros/s/AKfycbzSnS76SnDykGZwXv99nehSwqJT_e4WQT_TpOVOtdYze-TkrMIWhtF0aBsvxhziw4Gm/exec?${params}`);
    } catch (error) {
        console.error('Failed to log order:', error);
    }
}

// Fetch live exchange rates
async function fetchExchangeRates() {
    try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        exchangeRates = {
            USD: 1,
            EUR: data.rates.EUR,
            GBP: data.rates.GBP
        };
    } catch (error) {
        console.log('Using default exchange rates');
    }
}

fetchExchangeRates();

// Currency conversion
function convertPrice(usdPrice) {
    const convertedPrice = usdPrice * exchangeRates[currentCurrency];
    const symbol = currentCurrency === 'USD' ? '$' : currentCurrency === 'EUR' ? '€' : '£';
    return `${symbol}${Math.round(convertedPrice)}`;
}

// Convert USD discount to current currency
function convertDiscount(usdDiscount) {
    const convertedDiscount = usdDiscount * exchangeRates[currentCurrency];
    const symbol = currentCurrency === 'USD' ? '$' : currentCurrency === 'EUR' ? '€' : '£';
    return `${symbol}${Math.round(convertedDiscount)}`;
}

// Helper functions to get costs in current currency
function getXboxCostText() {
    const xboxCostConverted = convertPrice(10);
    return `Xbox (+${xboxCostConverted})`;
}

function getExpressCostText() {
    const expressCostConverted = convertPrice(13);
    return `Express (+${expressCostConverted})`;
}

function getXboxSubCostText() {
    const xboxSubCostConverted = convertPrice(30);
    return `Xbox (+${xboxSubCostConverted})`;
}

// Page navigation function
function navigateToPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.remove('active');
    });

    // Show selected page
    const targetPage = document.getElementById(pageName);
    if (targetPage) {
        targetPage.classList.add('active');
        
        // Special handling for subscription page
        if (pageName === 'subscription') {
            // Make sure the subscription service content is visible
            const subscriptionContent = targetPage.querySelector('.service-content');
            if (subscriptionContent) {
                subscriptionContent.classList.add('active');
                subscriptionContent.style.display = 'block';
            }
        }
        
        // Special handling for services page
        if (pageName === 'services') {
            // Ensure the currently active tab's content is visible
            const activeTab = document.querySelector('.tab.active');
            if (activeTab) {
                const activeServiceContent = document.getElementById(activeTab.dataset.service);
                if (activeServiceContent) {
                    activeServiceContent.classList.add('active');
                }
            } else {
                // If no tab is active, activate the first one (FUT Champions)
                const firstTab = document.querySelector('.tab[data-service="fut-champions"]');
                const futContent = document.getElementById('fut-champions');
                if (firstTab && futContent) {
                    firstTab.classList.add('active');
                    futContent.classList.add('active');
                }
            }
        }
    }

    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === pageName) {
            link.classList.add('active');
        }
    });

    // Close mobile menu
    document.getElementById('navMenu').classList.remove('active');

    // Scroll to top
    window.scrollTo(0, 0);
}

// Initialize service options when page loads
let serviceOptions = {
    fut: { platform: 'playstation', delivery: 'normal', payment: 'paypal' },
    div: { platform: 'playstation', delivery: 'normal', payment: 'paypal' },
    draft: { platform: 'playstation', delivery: 'normal', payment: 'paypal' },
    friendly: { platform: 'playstation', delivery: 'normal', payment: 'paypal' },
    squad: { platform: 'playstation', delivery: 'normal', payment: 'paypal' },
    sub: { platform: 'playstation', payment: 'paypal' },
    evo: { platform: 'playstation', delivery: 'normal', payment: 'paypal' }
};

// Promo Code Functionality
let appliedPromos = {};

async function applyPromoCode(service) {
    const input = document.getElementById(`${service}-promo-code`);
    const message = document.getElementById(`${service}-promo-message`);
    const button = input.nextElementSibling;
    const code = input.value.trim().toUpperCase();

    if (!code) {
        showPromoMessage(message, 'Please enter a promo code', 'error');
        return;
    }

    button.disabled = true;
    button.textContent = 'Checking...';
    showPromoMessage(message, 'Validating promo code...', 'loading');

    try {
        const response = await fetch(`https://script.google.com/macros/s/AKfycbxNOy_OULZAOj-yLbNj8YTmO88EjTGgtmnHHf3_km3FkTOV2L7zEwLPVOUhiCPdR21s/exec?code=${encodeURIComponent(code)}&service=${service.toUpperCase()}`);

        const data = await response.json();

        if (data.success) {
            // حفظ البرومو كود مع التأكد من وجود البيانات الصحيحة
            appliedPromos[service] = {
                code: code,
                type: data.type || 'fixed', // default to fixed if not specified
                value: parseFloat(data.value) || parseFloat(data.discount) || 0,
                discount: parseFloat(data.discount) || parseFloat(data.value) || 0
            };

            console.log('Promo applied:', appliedPromos[service]); // للتأكد من البيانات

            input.disabled = true;
            button.textContent = 'Applied';

            // إعادة حساب السعر فوراً مع تأخير صغير للتأكد من تحديث البيانات
            setTimeout(() => {
                if (service === 'fut') updateFutPrice();
                if (service === 'div') updateDivPrice();
                if (service === 'draft') updateDraftPrice();
                if (service === 'friendly') updateFriendlyPrice();
                if (service === 'squad') updateSquadPrice();
                if (service === 'evo') updateEvoPrice();
                if (service === 'sub') updateSubPrice();

                // عرض الرسالة بعد إعادة حساب السعر لحساب الخصم الصحيح
                updatePromoSuccessMessage(service);
            }, 100);

        } else {
            showPromoMessage(message, data.message || 'Invalid promo code', 'error');
            button.disabled = false;
            button.textContent = 'Apply';
        }

    } catch (error) {
        console.error('Promo code error:', error);
        showPromoMessage(message, 'Error validating promo code. Please try again.', 'error');
        button.disabled = false;
        button.textContent = 'Apply';
    }
}

function showPromoMessage(messageEl, text, type) {
    messageEl.textContent = text;
    messageEl.className = `promo-message ${type}`;
    messageEl.style.display = 'block';
}

// حساب وعرض رسالة نجاح البرومو كود بالخصم الفعلي
function updatePromoSuccessMessage(service) {
    if (!appliedPromos[service]) return;

    const message = document.getElementById(`${service}-promo-message`);
    let actualDiscountUSD = 0;

    // حساب الخصم الفعلي حسب الخدمة والسعر الحالي
    if (service === 'fut') {
        const wins = document.getElementById('fut-current-wins').value;
        const loses = document.getElementById('fut-current-loses').value;
        const rankOption = document.getElementById('fut-required-rank').selectedOptions[0];

        if (wins && loses && rankOption && rankOption.value) {
            let originalPriceUSD = parseInt(rankOption.value);
            if (serviceOptions.fut?.platform === 'xbox') originalPriceUSD += 10;
            if (serviceOptions.fut?.delivery === 'express') originalPriceUSD += 13;

            const finalPriceUSD = applyDiscount(originalPriceUSD, 'fut');
            actualDiscountUSD = originalPriceUSD - finalPriceUSD;
        }
    } else if (service === 'div') {
        const current = parseInt(document.getElementById('div-current').value);
        const required = parseInt(document.getElementById('div-required').value);

        if (current && (required || required === 0)) {
            const prices = { '10-9': 10, '9-8': 10, '8-7': 10, '7-6': 13, '6-5': 18, '5-4': 23, '4-3': 29, '3-2': 37, '2-1': 45, '1-0': 53 };
            let originalPriceUSD = 0;

            for (let i = current; i > required; i--) {
                const key = `${i}-${i - 1}`;
                originalPriceUSD += prices[key];
            }

            if (serviceOptions.div?.platform === 'xbox') originalPriceUSD += 10;
            if (serviceOptions.div?.delivery === 'express') originalPriceUSD += 13;

            const finalPriceUSD = applyDiscount(originalPriceUSD, 'div');
            actualDiscountUSD = originalPriceUSD - finalPriceUSD;
        }
    } else if (service === 'draft') {
        const wins = parseInt(document.getElementById('draft-wins').value);

        if (wins) {
            const prices = { 1: 8, 2: 17, 3: 27, 4: 38 };
            let originalPriceUSD = prices[wins];

            if (serviceOptions.draft?.platform === 'xbox') originalPriceUSD += 10;
            if (serviceOptions.draft?.delivery === 'express') originalPriceUSD += 13;

            const finalPriceUSD = applyDiscount(originalPriceUSD, 'draft');
            actualDiscountUSD = originalPriceUSD - finalPriceUSD;
        }
    } else if (service === 'friendly') {
        const cupType = document.getElementById('friendly-cup-type').value;
        const rewardOption = document.getElementById('friendly-reward').selectedOptions[0];

        if (cupType && rewardOption && rewardOption.value) {
            let originalPriceUSD = parseInt(rewardOption.value);

            if (serviceOptions.friendly?.platform === 'xbox') originalPriceUSD += 10;
            if (serviceOptions.friendly?.delivery === 'express') originalPriceUSD += 13;

            const finalPriceUSD = applyDiscount(originalPriceUSD, 'friendly');
            actualDiscountUSD = originalPriceUSD - finalPriceUSD;
        }
    } else if (service === 'squad') {
        const rankOption = document.getElementById('squad-rank').selectedOptions[0];

        if (rankOption && rankOption.value) {
            let originalPriceUSD = parseInt(rankOption.value);

            if (serviceOptions.squad?.platform === 'xbox') originalPriceUSD += 10;
            if (serviceOptions.squad?.delivery === 'express') originalPriceUSD += 13;

            const finalPriceUSD = applyDiscount(originalPriceUSD, 'squad');
            actualDiscountUSD = originalPriceUSD - finalPriceUSD;
        }
    } else if (service === 'evo') {
        const evoNumberOption = document.getElementById('evo-number').selectedOptions[0];

        if (evoNumberOption && evoNumberOption.value) {
            let originalPriceUSD = parseInt(evoNumberOption.value);

            if (serviceOptions.evo?.platform === 'xbox') originalPriceUSD += 10;
            if (serviceOptions.evo?.delivery === 'express') originalPriceUSD += 13;

            const finalPriceUSD = applyDiscount(originalPriceUSD, 'evo');
            actualDiscountUSD = originalPriceUSD - finalPriceUSD;
        }
    } else if (service === 'sub') {
        const rankOption = document.getElementById('sub-rank-div').selectedOptions[0];

        if (rankOption && rankOption.value) {
            let originalPriceUSD = parseInt(rankOption.value);
            if (serviceOptions.sub?.platform === 'xbox') originalPriceUSD += 30;

            const finalPriceUSD = applyDiscount(originalPriceUSD, 'sub');
            actualDiscountUSD = originalPriceUSD - finalPriceUSD;
        }
    }

    // عرض الرسالة بالخصم الفعلي
    if (actualDiscountUSD > 0) {
        const actualDiscountConverted = convertDiscount(actualDiscountUSD);
        showPromoMessage(message, `✅ Promo code applied! You saved ${actualDiscountConverted}`, 'success');
    }
}

// تطبيق الخصم (بالدولار أولاً ثم تحويل العملة)
function applyDiscount(originalPriceUSD, service) {
    if (appliedPromos[service]) {
        const promo = appliedPromos[service];
        let discountedPriceUSD;

        console.log('Applying discount:', promo); // للتأكد من تطبيق الخصم

        if (promo.type.toLowerCase() === 'percentage') {
            // For percentage: use value as percentage
            const discountAmount = originalPriceUSD * (promo.value / 100);
            discountedPriceUSD = Math.round(originalPriceUSD - discountAmount);
            console.log(`Percentage discount: ${promo.value}% of $${originalPriceUSD} = $${discountAmount.toFixed(2)} discount`);
        } else { // fixed discount or fallback
            // For fixed: use value as dollar amount
            const discountValue = promo.value || promo.discount || 0;
            discountedPriceUSD = Math.max(0, originalPriceUSD - discountValue);
            console.log(`Fixed discount: $${discountValue} from $${originalPriceUSD}`);
        }

        console.log('Original price:', originalPriceUSD, 'Final price:', discountedPriceUSD);
        return discountedPriceUSD;
    }
    return originalPriceUSD;
}

// Navigation functionality
document.addEventListener('DOMContentLoaded', function () {
    // Navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const targetPage = this.dataset.page;
            if (targetPage) {
                navigateToPage(targetPage);
            }
        });
    });

    // Mobile menu toggle
    document.getElementById('mobileMenuBtn').addEventListener('click', function (e) {
        e.preventDefault();
        document.getElementById('navMenu').classList.toggle('active');
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', function (e) {
        const navMenu = document.getElementById('navMenu');
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');

        if (!navMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
            navMenu.classList.remove('active');
        }
    });

    // Initialize services
    initFutChampions();
    initDivisionRivals();
    initOnlineDraft();
    initFriendlyCup();
    initSquadBattle();
    initEvolution();
    initSubscription();
    
    // Pre-generate order numbers for faster response
    preGenerateOrderNumbers();

    // Add this to your DOMContentLoaded event listener
document.addEventListener('visibilitychange', function() {
        if (!document.hidden && processingOrder) {
            // User came back to the tab, reset processing state
            setTimeout(() => {
                processingOrder = false;
                
                // Reset all order buttons
                const orderButtons = [
                    { btn: document.getElementById('fut-order-btn'), text: 'Order Now' },
                    { btn: document.getElementById('div-order-btn'), text: 'Order Now' },
                    { btn: document.getElementById('draft-order-btn'), text: 'Order Now' },
                    { btn: document.getElementById('friendly-order-btn'), text: 'Order Now' },
                    { btn: document.getElementById('squad-order-btn'), text: 'Order Now' },
                    { btn: document.getElementById('evo-order-btn'), text: 'Order Now' },
                    { btn: document.getElementById('sub-order-btn'), text: 'Order Now' }
                ];
                
                orderButtons.forEach(item => resetOrderButton(item.btn, item.text));
            }, 1000); // 1 second after they return to the tab
        }
        
        // Keep your existing pregenerate logic
        if (!document.hidden && preGeneratedOrderNumbers.length < 5) {
            preGenerateOrderNumbers();
        }
    });
});

function resetOrderButton(button, originalText) {
    if (button) {
        button.disabled = false;
        button.textContent = originalText;
        button.style.opacity = '1';
    }
}
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
document.querySelectorAll('.currency-btn').forEach(btn => {
    btn.addEventListener('click', function () {
        document.querySelectorAll('.currency-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentCurrency = this.dataset.currency;

        // إعادة حساب كل الأسعار والبرومو عند تغيير العملة
        updateFutPrice();
        updateDivPrice();
        updateDraftPrice();
        updateFriendlyPrice();
        updateSquadPrice();
        updateEvoPrice();
        updateSubPrice();

        // تحديث رسائل البرومو المطبقة
        updatePromoMessages();
    });
});

// تحديث رسائل البرومو عند تغيير العملة
function updatePromoMessages() {
    ['fut', 'div', 'draft', 'friendly', 'squad', 'evo', 'sub'].forEach(service => {
        if (appliedPromos[service]) {
            updatePromoSuccessMessage(service);
        }
    });
}

// Service tabs functionality
document.addEventListener('click', function (e) {
    if (e.target.classList.contains('tab') && !e.target.classList.contains('disabled')) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.service-content').forEach(c => c.classList.remove('active'));

        e.target.classList.add('active');
        document.getElementById(e.target.dataset.service).classList.add('active');
    }
});

// Button selection functionality
document.addEventListener('click', function (e) {
    if (e.target.classList.contains('select-btn')) {
        const service = e.target.dataset.service;
        const option = e.target.dataset.option;
        const isDelivery = option === 'normal' || option === 'express';
        const isPayment = option === 'paypal' || option === 'payoneer';
        const isPlatform = option === 'playstation' || option === 'xbox';

        // Update button states (make clicked button green)
        const buttonGroup = e.target.parentElement;
        buttonGroup.querySelectorAll('.select-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');

        // Update service options
        if (isPlatform) {
            serviceOptions[service].platform = option;
        } else if (isDelivery) {
            serviceOptions[service].delivery = option;
        } else if (isPayment) {
            serviceOptions[service].payment = option;
        }

        // Update prices based on service
        if (service === 'fut') updateFutPrice();
        if (service === 'div') updateDivPrice();
        if (service === 'draft') updateDraftPrice();
        if (service === 'friendly') updateFriendlyPrice();
        if (service === 'squad') updateSquadPrice();
        if (service === 'evo') updateEvoPrice();
        if (service === 'sub') updateSubPrice();
    }
});

// FUT Champions Logic
function initFutChampions() {
    const winsSelect = document.getElementById('fut-current-wins');
    const losesSelect = document.getElementById('fut-current-loses');
    const rankSelect = document.getElementById('fut-required-rank');

    // Clear existing options
    winsSelect.innerHTML = '<option value="">Select Current Wins</option>';
    losesSelect.innerHTML = '<option value="">Select Current Loses</option>';

    for (let i = 0; i <= 15; i++) {
        winsSelect.innerHTML += `<option value="${i}">${i}</option>`;
        losesSelect.innerHTML += `<option value="${i}">${i}</option>`;
    }

    function updateAvailableRanks() {
        const loses = parseInt(losesSelect.value) || 0;
        const ranks = ['Rank 1', 'Rank 2', 'Rank 3', 'Rank 4', 'Rank 5', 'Rank 6', 'Rank 7'];
        const prices = [100, 90, 80, 70, 60, 50, 40];

        rankSelect.innerHTML = '<option value="">Select Required Rank</option>';

        for (let i = loses; i < ranks.length; i++) {
            const price = prices[i - loses];
            rankSelect.innerHTML += `<option value="${price}" data-rank="${ranks[i]}">${ranks[i]}</option>`;
        }

        updateFutPrice();
    }

    losesSelect.addEventListener('change', updateAvailableRanks);
    winsSelect.addEventListener('change', updateFutPrice);
    rankSelect.addEventListener('change', updateFutPrice);
}

function updateFutPrice() {
    const wins = document.getElementById('fut-current-wins').value;
    const loses = document.getElementById('fut-current-loses').value;
    const rankOption = document.getElementById('fut-required-rank').selectedOptions[0];

    if (wins && loses && rankOption && rankOption.value) {
        let originalPriceUSD = parseInt(rankOption.value);
        const rankName = rankOption.dataset.rank;

        // Add Xbox platform cost (in USD)
        if (serviceOptions.fut && serviceOptions.fut.platform === 'xbox') {
            originalPriceUSD += 10;
        }

        // Add express delivery cost (in USD)
        if (serviceOptions.fut && serviceOptions.fut.delivery === 'express') {
            originalPriceUSD += 13;
        }

        // تطبيق الخصم (بالدولار)
        const finalPriceUSD = applyDiscount(originalPriceUSD, 'fut');

        // تحويل السعر النهائي للعملة الحالية
        const finalPriceConverted = convertPrice(finalPriceUSD);

        // تحديث السعر الأخضر
        document.getElementById('fut-price-amount').textContent = finalPriceConverted;
        document.getElementById('fut-currency').textContent = currentCurrency;
        document.getElementById('fut-price').style.display = 'block';
        document.getElementById('fut-promo-section').style.display = 'block';

        const deliveryText = (serviceOptions.fut && serviceOptions.fut.delivery === 'express') ? getExpressCostText() : 'Normal';
        const paymentText = (serviceOptions.fut && serviceOptions.fut.payment) ? serviceOptions.fut.payment : 'paypal';
        const platformText = (serviceOptions.fut && serviceOptions.fut.platform === 'xbox') ? getXboxCostText() : 'PlayStation';

        let summaryContent = `
                    <div class="summary-item"><span>Service:</span><span>FUT Champions</span></div>
                    <div class="summary-item"><span>Current Record:</span><span>${wins}W - ${loses}L</span></div>
                    <div class="summary-item"><span>Target Rank:</span><span>${rankName}</span></div>
                    <div class="summary-item"><span>Platform:</span><span>${platformText}</span></div>
                    <div class="summary-item"><span>Delivery:</span><span>${deliveryText}</span></div>
                    <div class="summary-item"><span>Payment:</span><span>${paymentText}</span></div>`;

        // إضافة الـ Promo فقط لو موجود
        if (appliedPromos.fut) {
            const savedAmountUSD = originalPriceUSD - finalPriceUSD;
            const savedAmountConverted = convertDiscount(savedAmountUSD);
            summaryContent += `<div class="summary-item"><span>Promo Code:</span><span style="color: #28a745;">${appliedPromos.fut.code} (-${savedAmountConverted})</span></div>`;
        }

        summaryContent += `<div class="summary-item"><span>Final Price:</span><span>${finalPriceConverted}</span></div>`;

        document.getElementById('fut-summary-content').innerHTML = summaryContent;
        document.getElementById('fut-summary').style.display = 'block';

        const orderBtn = document.getElementById('fut-order-btn');
        orderBtn.disabled = false;
        orderBtn.textContent = 'Order Now';
        orderBtn.onclick = () => orderFutChampions(wins, loses, rankName, finalPriceConverted);
    } else {
        document.getElementById('fut-price').style.display = 'none';
        document.getElementById('fut-promo-section').style.display = 'none';
        document.getElementById('fut-summary').style.display = 'none';
        document.getElementById('fut-order-btn').disabled = true;
        document.getElementById('fut-order-btn').textContent = 'Select all options first';
    }
}

async function orderFutChampions(wins, loses, rank, price) {
    if (processingOrder) return;
    
    // IMMEDIATELY disable button and show feedback
    const orderBtn = document.getElementById('fut-order-btn');
    if (orderBtn.disabled) return; // Prevent duplicate clicks
    
    orderBtn.disabled = true;
    orderBtn.textContent = 'Processing...';
    orderBtn.style.opacity = '0.6'; // Visual feedback
    
    processingOrder = true;
    
    if (!validateEmail('fut')) {
        // Reset button and processing state if validation fails
        orderBtn.disabled = false;
        orderBtn.textContent = 'Order Now';
        orderBtn.style.opacity = '1';
        processingOrder = false;
        return;
    }
    
    const orderNumber = await getNextOrderNumber();
    const email = document.getElementById('fut-email').value || 'Not provided';
    const deliveryText = (serviceOptions.fut && serviceOptions.fut.delivery === 'express') ? `Express (+${convertPrice(13)})` : 'Normal';
    const paymentText = (serviceOptions.fut && serviceOptions.fut.payment) ? serviceOptions.fut.payment : 'paypal';
    const platformText = (serviceOptions.fut && serviceOptions.fut.platform === 'xbox') ? `Xbox (+${convertPrice(10)})` : 'PlayStation';

    // Optional: Log to server
    logOrderToServer(orderNumber, 'FUT Champions', email, price);

    let message = `🎮 QBoosting Order #${orderNumber}

Service: FUT Champions
Current Record: ${wins}W - ${loses}L
Target Rank: ${rank}
Platform: ${platformText}
Delivery: ${deliveryText}
Payment Method: ${paymentText}
Email: ${email}`;

    // إضافة الـ Promo لو موجود
    if (appliedPromos.fut) {
        message += `\nPromo Code: ${appliedPromos.fut.code} ✅`;
    }

    message += `\nFinal Price: ${price}

Ready to start when you confirm! 🚀`;

    window.open(`https://t.me/QBoostingHelp?text=${encodeURIComponent(message)}`, '_blank');

        setTimeout(() => {
    processingOrder = false;
    resetOrderButton(orderBtn, 'Order Now');
}, 3000); // Changed from 2000 to 3000 (3 seconds max)
}

// Division Rivals Logic
function initDivisionRivals() {
    const currentSelect = document.getElementById('div-current');
    const requiredSelect = document.getElementById('div-required');

    currentSelect.addEventListener('change', updateRequiredDivisions);
    requiredSelect.addEventListener('change', updateDivPrice);
}

function updateRequiredDivisions() {
    const current = parseInt(document.getElementById('div-current').value);
    const requiredSelect = document.getElementById('div-required');

    requiredSelect.innerHTML = '<option value="">Select Required Division</option>';

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
        { value: 0, name: 'Elite Division' }
    ];

    divisions.forEach(div => {
        if (div.value < current) {
            requiredSelect.innerHTML += `<option value="${div.value}">${div.name}</option>`;
        }
    });

    updateDivPrice();
}

function updateDivPrice() {
    const current = parseInt(document.getElementById('div-current').value);
    const required = parseInt(document.getElementById('div-required').value);

    if (current && (required || required === 0)) {
        const prices = {
            '10-9': 10, '9-8': 10, '8-7': 10, '7-6': 13,
            '6-5': 18, '5-4': 23, '4-3': 29, '3-2': 37,
            '2-1': 45, '1-0': 53
        };

        let originalPriceUSD = 0;

        for (let i = current; i > required; i--) {
            const key = `${i}-${i - 1}`;
            const stepPrice = prices[key];
            originalPriceUSD += stepPrice;
        }

        // Add Xbox platform cost (in USD)
        if (serviceOptions.div && serviceOptions.div.platform === 'xbox') {
            originalPriceUSD += 10;
        }

        // Add express delivery cost (in USD)
        if (serviceOptions.div && serviceOptions.div.delivery === 'express') {
            originalPriceUSD += 13;
        }

        // تطبيق الخصم (بالدولار)
        const finalPriceUSD = applyDiscount(originalPriceUSD, 'div');

        // تحويل السعر النهائي للعملة الحالية
        const finalPriceConverted = convertPrice(finalPriceUSD);

        // تحديث السعر الأخضر
        document.getElementById('div-price-amount').textContent = finalPriceConverted;
        document.getElementById('div-currency').textContent = currentCurrency;
        document.getElementById('div-price').style.display = 'block';
        document.getElementById('div-promo-section').style.display = 'block';

        const currentDivName = current === 0 ? 'Elite Division' : `Division ${current}`;
        const requiredDivName = required === 0 ? 'Elite Division' : `Division ${required}`;
        const deliveryText = (serviceOptions.div && serviceOptions.div.delivery === 'express') ? getExpressCostText() : 'Normal';
        const paymentText = (serviceOptions.div && serviceOptions.div.payment) ? serviceOptions.div.payment : 'paypal';
        const platformText = (serviceOptions.div && serviceOptions.div.platform === 'xbox') ? getXboxCostText() : 'PlayStation';

        let summaryContent = `
                    <div class="summary-item"><span>Service:</span><span>Division Rivals</span></div>
                    <div class="summary-item"><span>From:</span><span>${currentDivName}</span></div>
                    <div class="summary-item"><span>To:</span><span>${requiredDivName}</span></div>
                    <div class="summary-item"><span>Platform:</span><span>${platformText}</span></div>
                    <div class="summary-item"><span>Delivery:</span><span>${deliveryText}</span></div>
                    <div class="summary-item"><span>Payment:</span><span>${paymentText}</span></div>`;

        // إضافة الـ Promo فقط لو موجود
        if (appliedPromos.div) {
            const savedAmountUSD = originalPriceUSD - finalPriceUSD;
            const savedAmountConverted = convertDiscount(savedAmountUSD);
            summaryContent += `<div class="summary-item"><span>Promo Code:</span><span style="color: #28a745;">${appliedPromos.div.code} (-${savedAmountConverted})</span></div>`;
        }

        summaryContent += `<div class="summary-item"><span>Final Price:</span><span>${finalPriceConverted}</span></div>`;

        document.getElementById('div-summary-content').innerHTML = summaryContent;
        document.getElementById('div-summary').style.display = 'block';

        const orderBtn = document.getElementById('div-order-btn');
        orderBtn.disabled = false;
        orderBtn.textContent = 'Order Now';
        orderBtn.onclick = () => orderDivisionRivals(currentDivName, requiredDivName, finalPriceConverted);
    } else {
        document.getElementById('div-price').style.display = 'none';
        document.getElementById('div-promo-section').style.display = 'none';
        document.getElementById('div-summary').style.display = 'none';
        document.getElementById('div-order-btn').disabled = true;
        document.getElementById('div-order-btn').textContent = 'Select all options first';
    }
}

async function orderDivisionRivals(current, required, price) {
if (processingOrder) return;
    
    // IMMEDIATELY disable button and show feedback
    const orderBtn = document.getElementById('div-order-btn');
    if (orderBtn.disabled) return; // Prevent duplicate clicks
    
    orderBtn.disabled = true;
    orderBtn.textContent = 'Processing...';
    orderBtn.style.opacity = '0.6'; // Visual feedback
    
    processingOrder = true;
    
    if (!validateEmail('div')) {
        // Reset button and processing state if validation fails
        orderBtn.disabled = false;
        orderBtn.textContent = 'Order Now';
        orderBtn.style.opacity = '1';
        processingOrder = false;
        return;
    }
    
    const orderNumber = await getNextOrderNumber();
    const email = document.getElementById('div-email').value || 'Not provided';
    const deliveryText = (serviceOptions.div && serviceOptions.div.delivery === 'express') ? `Express (+${convertPrice(13)})` : 'Normal';
    const paymentText = (serviceOptions.div && serviceOptions.div.payment) ? serviceOptions.div.payment : 'paypal';
    const platformText = (serviceOptions.div && serviceOptions.div.platform === 'xbox') ? `Xbox (+${convertPrice(10)})` : 'PlayStation';

    // Optional: Log to server
    logOrderToServer(orderNumber, 'Division Rivals', email, price);

    let message = `🎮 QBoosting Order #${orderNumber}

Service: Division Rivals
Current Division: ${current}
Target Division: ${required}
Platform: ${platformText}
Delivery: ${deliveryText}
Payment Method: ${paymentText}
Email: ${email}`;

    // إضافة الـ Promo لو موجود
    if (appliedPromos.div) {
        message += `\nPromo Code: ${appliedPromos.div.code} ✅`;
    }

    message += `\nFinal Price: ${price}

Ready to start when you confirm! 🚀`;

    window.open(`https://t.me/QBoostingHelp?text=${encodeURIComponent(message)}`, '_blank');
    
    setTimeout(() => {
    processingOrder = false;
    resetOrderButton(orderBtn, 'Order Now');
}, 3000); // Changed from 2000 to 3000 (3 seconds max)
}

// Online Draft Logic
function initOnlineDraft() {
    const winsSelect = document.getElementById('draft-wins');
    winsSelect.addEventListener('change', updateDraftPrice);
}

function updateDraftPrice() {
    const wins = parseInt(document.getElementById('draft-wins').value);

    if (wins) {
        const prices = { 1: 8, 2: 17, 3: 27, 4: 38 };
        let originalPriceUSD = prices[wins];

        // Add Xbox platform cost (in USD)
        if (serviceOptions.draft && serviceOptions.draft.platform === 'xbox') {
            originalPriceUSD += 10;
        }

        // Add express delivery cost (in USD)
        if (serviceOptions.draft && serviceOptions.draft.delivery === 'express') {
            originalPriceUSD += 13;
        }

        // تطبيق الخصم (بالدولار)
        const finalPriceUSD = applyDiscount(originalPriceUSD, 'draft');

        // تحويل السعر النهائي للعملة الحالية
        const finalPriceConverted = convertPrice(finalPriceUSD);

        // تحديث السعر الأخضر
        document.getElementById('draft-price-amount').textContent = finalPriceConverted;
        document.getElementById('draft-currency').textContent = currentCurrency;
        document.getElementById('draft-price').style.display = 'block';
        document.getElementById('draft-promo-section').style.display = 'block';

        const deliveryText = (serviceOptions.draft && serviceOptions.draft.delivery === 'express') ? getExpressCostText() : 'Normal';
        const paymentText = (serviceOptions.draft && serviceOptions.draft.payment) ? serviceOptions.draft.payment : 'paypal';
        const platformText = (serviceOptions.draft && serviceOptions.draft.platform === 'xbox') ? getXboxCostText() : 'PlayStation';

        let summaryContent = `
                    <div class="summary-item"><span>Service:</span><span>Online Draft</span></div>
                    <div class="summary-item"><span>Required Wins:</span><span>${wins} Win${wins > 1 ? 's' : ''}</span></div>
                    <div class="summary-item"><span>Platform:</span><span>${platformText}</span></div>
                    <div class="summary-item"><span>Delivery:</span><span>${deliveryText}</span></div>
                    <div class="summary-item"><span>Payment:</span><span>${paymentText}</span></div>`;

        // إضافة الـ Promo فقط لو موجود
        if (appliedPromos.draft) {
            const savedAmountUSD = originalPriceUSD - finalPriceUSD;
            const savedAmountConverted = convertDiscount(savedAmountUSD);
            summaryContent += `<div class="summary-item"><span>Promo Code:</span><span style="color: #28a745;">${appliedPromos.draft.code} (-${savedAmountConverted})</span></div>`;
        }

        summaryContent += `<div class="summary-item"><span>Final Price:</span><span>${finalPriceConverted}</span></div>`;

        document.getElementById('draft-summary-content').innerHTML = summaryContent;
        document.getElementById('draft-summary').style.display = 'block';

        const orderBtn = document.getElementById('draft-order-btn');
        orderBtn.disabled = false;
        orderBtn.textContent = 'Order Now';
        orderBtn.onclick = () => orderOnlineDraft(wins, finalPriceConverted);
    } else {
        document.getElementById('draft-price').style.display = 'none';
        document.getElementById('draft-promo-section').style.display = 'none';
        document.getElementById('draft-summary').style.display = 'none';
        document.getElementById('draft-order-btn').disabled = true;
        document.getElementById('draft-order-btn').textContent = 'Select all options first';
    }
}

async function orderOnlineDraft(wins, price) {
if (processingOrder) return;
    
    // IMMEDIATELY disable button and show feedback
    const orderBtn = document.getElementById('draft-order-btn');
    if (orderBtn.disabled) return; // Prevent duplicate clicks
    
    orderBtn.disabled = true;
    orderBtn.textContent = 'Processing...';
    orderBtn.style.opacity = '0.6'; // Visual feedback
    
    processingOrder = true;
    
    if (!validateEmail('draft')) {
        // Reset button and processing state if validation fails
        orderBtn.disabled = false;
        orderBtn.textContent = 'Order Now';
        orderBtn.style.opacity = '1';
        processingOrder = false;
        return;
    }
    
    const orderNumber = await getNextOrderNumber();
    const email = document.getElementById('draft-email').value || 'Not provided';
    const deliveryText = (serviceOptions.draft && serviceOptions.draft.delivery === 'express') ? `Express (+${convertPrice(13)})` : 'Normal';
    const paymentText = (serviceOptions.draft && serviceOptions.draft.payment) ? serviceOptions.draft.payment : 'paypal';
    const platformText = (serviceOptions.draft && serviceOptions.draft.platform === 'xbox') ? `Xbox (+${convertPrice(10)})` : 'PlayStation';

    // Optional: Log to server
    logOrderToServer(orderNumber, 'Online Draft', email, price);

    let message = `🎮 QBoosting Order #${orderNumber}

Service: Online Draft
Required Wins: ${wins} Win${wins > 1 ? 's' : ''}
Platform: ${platformText}
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

    window.open(`https://t.me/QBoostingHelp?text=${encodeURIComponent(message)}`, '_blank');
    setTimeout(() => {
    processingOrder = false;
    resetOrderButton(orderBtn, 'Order Now');
}, 3000); // Changed from 2000 to 3000 (3 seconds max)
}

// Friendly Cup Logic
function initFriendlyCup() {
    const cupTypeSelect = document.getElementById('friendly-cup-type');
    const rewardSelect = document.getElementById('friendly-reward');

    cupTypeSelect.addEventListener('change', updateRewardOptions);
    rewardSelect.addEventListener('change', updateFriendlyPrice);
}

function updateRewardOptions() {
    const cupType = document.getElementById('friendly-cup-type').value;
    const rewardSelect = document.getElementById('friendly-reward');

    rewardSelect.innerHTML = '<option value="">Select Cup Type First</option>';

    if (cupType === 'co-op') {
        rewardSelect.innerHTML = `
            <option value="">Select Reward</option>
            <option value="60" data-name="97 Rui Costa">97 Rui Costa</option>
        `;
    }

    updateFriendlyPrice();
}

function updateFriendlyPrice() {
    const cupType = document.getElementById('friendly-cup-type').value;
    const rewardOption = document.getElementById('friendly-reward').selectedOptions[0];

    if (cupType && rewardOption && rewardOption.value) {
        let originalPriceUSD = parseInt(rewardOption.value);
        const rewardName = rewardOption.dataset.name;

        // Add Xbox platform cost
        if (serviceOptions.friendly && serviceOptions.friendly.platform === 'xbox') {
            originalPriceUSD += 10;
        }

        // Add express delivery cost  
        if (serviceOptions.friendly && serviceOptions.friendly.delivery === 'express') {
            originalPriceUSD += 13;
        }

        // Apply discount
        const finalPriceUSD = applyDiscount(originalPriceUSD, 'friendly');
        const finalPriceConverted = convertPrice(finalPriceUSD);

        // Update displays...
        document.getElementById('friendly-price-amount').textContent = finalPriceConverted;
        document.getElementById('friendly-currency').textContent = currentCurrency;
        document.getElementById('friendly-price').style.display = 'block';
        document.getElementById('friendly-promo-section').style.display = 'block';

        // Create summary...
        const deliveryText = (serviceOptions.friendly && serviceOptions.friendly.delivery === 'express') ? getExpressCostText() : 'Normal';
        const paymentText = (serviceOptions.friendly && serviceOptions.friendly.payment) ? serviceOptions.friendly.payment : 'paypal';
        const platformText = (serviceOptions.friendly && serviceOptions.friendly.platform === 'xbox') ? getXboxCostText() : 'PlayStation';

        let summaryContent = `
            <div class="summary-item"><span>Service:</span><span>Friendly Cup</span></div>
            <div class="summary-item"><span>Cup Type:</span><span>Co-op Cup</span></div>
            <div class="summary-item"><span>Reward:</span><span>${rewardName}</span></div>
            <div class="summary-item"><span>Platform:</span><span>${platformText}</span></div>
            <div class="summary-item"><span>Delivery:</span><span>${deliveryText}</span></div>
            <div class="summary-item"><span>Payment:</span><span>${paymentText}</span></div>`;

        // Add promo if applied
        if (appliedPromos.friendly) {
            const savedAmountUSD = originalPriceUSD - finalPriceUSD;
            const savedAmountConverted = convertDiscount(savedAmountUSD);
            summaryContent += `<div class="summary-item"><span>Promo Code:</span><span style="color: #28a745;">${appliedPromos.friendly.code} (-${savedAmountConverted})</span></div>`;
        }

        summaryContent += `<div class="summary-item"><span>Final Price:</span><span>${finalPriceConverted}</span></div>`;

        document.getElementById('friendly-summary-content').innerHTML = summaryContent;
        document.getElementById('friendly-summary').style.display = 'block';

        const orderBtn = document.getElementById('friendly-order-btn');
        orderBtn.disabled = false;
        orderBtn.textContent = 'Order Now';
        orderBtn.onclick = () => orderFriendlyCup(rewardName, finalPriceConverted);
    } else {
        // Hide everything if incomplete
        document.getElementById('friendly-price').style.display = 'none';
        document.getElementById('friendly-promo-section').style.display = 'none';
        document.getElementById('friendly-summary').style.display = 'none';
        document.getElementById('friendly-order-btn').disabled = true;
        document.getElementById('friendly-order-btn').textContent = 'Select all options first';
    }
}

async function orderFriendlyCup(reward, price) {
if (processingOrder) return;
    
    // IMMEDIATELY disable button and show feedback
    const orderBtn = document.getElementById('friendly-order-btn');
    if (orderBtn.disabled) return; // Prevent duplicate clicks
    
    orderBtn.disabled = true;
    orderBtn.textContent = 'Processing...';
    orderBtn.style.opacity = '0.6'; // Visual feedback
    
    processingOrder = true;
    
    if (!validateEmail('friendly')) {
        // Reset button and processing state if validation fails
        orderBtn.disabled = false;
        orderBtn.textContent = 'Order Now';
        orderBtn.style.opacity = '1';
        processingOrder = false;
        return;
    }
    
    const orderNumber = await getNextOrderNumber();
    const email = document.getElementById('friendly-email').value;
    const deliveryText = (serviceOptions.friendly && serviceOptions.friendly.delivery === 'express') ? `Express (+${convertPrice(13)})` : 'Normal';
    const paymentText = (serviceOptions.friendly && serviceOptions.friendly.payment) ? serviceOptions.friendly.payment : 'paypal';
    const platformText = (serviceOptions.friendly && serviceOptions.friendly.platform === 'xbox') ? `Xbox (+${convertPrice(10)})` : 'PlayStation';

    // Optional: Log to google sheet
    logOrderToServer(orderNumber, 'Friendly Cup', email, price);

    let message = `🎮 QBoosting Order #${orderNumber}

Service: Friendly Cup
Cup Type: Co-op Cup  
Reward: ${reward}
Platform: ${platformText}
Delivery: ${deliveryText}
Payment Method: ${paymentText}
Email: ${email}`;

    // Add promo if applied
    if (appliedPromos.friendly) {
        message += `\nPromo Code: ${appliedPromos.friendly.code} ✅`;
    }

    message += `\nFinal Price: ${price}

Ready to start when you confirm! 🚀`;

    window.open(`https://t.me/QBoostingHelp?text=${encodeURIComponent(message)}`, '_blank');
   setTimeout(() => {
    processingOrder = false;
    resetOrderButton(orderBtn, 'Order Now');
}, 3000); // Changed from 2000 to 3000 (3 seconds max)
}

// Squad Battle Logic
function initSquadBattle() {
    const rankSelect = document.getElementById('squad-rank');
    rankSelect.addEventListener('change', updateSquadPrice);
}

function updateSquadPrice() {
    const rankOption = document.getElementById('squad-rank').selectedOptions[0];

    if (rankOption && rankOption.value) {
        let originalPriceUSD = parseInt(rankOption.value);
        const rankName = rankOption.dataset.name;

        // Add Xbox platform cost
        if (serviceOptions.squad && serviceOptions.squad.platform === 'xbox') {
            originalPriceUSD += 10;
        }

        // Add express delivery cost
        if (serviceOptions.squad && serviceOptions.squad.delivery === 'express') {
            originalPriceUSD += 13;
        }

        // Apply discount
        const finalPriceUSD = applyDiscount(originalPriceUSD, 'squad');

        // Convert to current currency
        const finalPriceConverted = convertPrice(finalPriceUSD);

        // Update price display
        document.getElementById('squad-price-amount').textContent = finalPriceConverted;
        document.getElementById('squad-currency').textContent = currentCurrency;
        document.getElementById('squad-price').style.display = 'block';
        document.getElementById('squad-promo-section').style.display = 'block';

        const deliveryText = (serviceOptions.squad && serviceOptions.squad.delivery === 'express') ? getExpressCostText() : 'Normal';
        const paymentText = (serviceOptions.squad && serviceOptions.squad.payment) ? serviceOptions.squad.payment : 'paypal';
        const platformText = (serviceOptions.squad && serviceOptions.squad.platform === 'xbox') ? getXboxCostText() : 'PlayStation';

        let summaryContent = `
            <div class="summary-item"><span>Service:</span><span>Squad Battle</span></div>
            <div class="summary-item"><span>Target Rank:</span><span>${rankName}</span></div>
            <div class="summary-item"><span>Platform:</span><span>${platformText}</span></div>
            <div class="summary-item"><span>Delivery:</span><span>${deliveryText}</span></div>
            <div class="summary-item"><span>Payment:</span><span>${paymentText}</span></div>`;

        // Add promo if applied
        if (appliedPromos.squad) {
            const savedAmountUSD = originalPriceUSD - finalPriceUSD;
            const savedAmountConverted = convertDiscount(savedAmountUSD);
            summaryContent += `<div class="summary-item"><span>Promo Code:</span><span style="color: #28a745;">${appliedPromos.squad.code} (-${savedAmountConverted})</span></div>`;
        }

        summaryContent += `<div class="summary-item"><span>Final Price:</span><span>${finalPriceConverted}</span></div>`;

        document.getElementById('squad-summary-content').innerHTML = summaryContent;
        document.getElementById('squad-summary').style.display = 'block';

        const orderBtn = document.getElementById('squad-order-btn');
        orderBtn.disabled = false;
        orderBtn.textContent = 'Order Now';
        orderBtn.onclick = () => orderSquadBattle(rankName, finalPriceConverted);
    } else {
        document.getElementById('squad-price').style.display = 'none';
        document.getElementById('squad-promo-section').style.display = 'none';
        document.getElementById('squad-summary').style.display = 'none';
        document.getElementById('squad-order-btn').disabled = true;
        document.getElementById('squad-order-btn').textContent = 'Select all options first';
    }
}

async function orderSquadBattle(rank, price) {
if (processingOrder) return;
    
    // IMMEDIATELY disable button and show feedback
    const orderBtn = document.getElementById('squad-order-btn');
    if (orderBtn.disabled) return; // Prevent duplicate clicks
    
    orderBtn.disabled = true;
    orderBtn.textContent = 'Processing...';
    orderBtn.style.opacity = '0.6'; // Visual feedback
    
    processingOrder = true;
    
    if (!validateEmail('squad')) {
        // Reset button and processing state if validation fails
        orderBtn.disabled = false;
        orderBtn.textContent = 'Order Now';
        orderBtn.style.opacity = '1';
        processingOrder = false;
        return;
    }
    
    const orderNumber = await getNextOrderNumber();
    const email = document.getElementById('squad-email').value;
    const deliveryText = (serviceOptions.squad && serviceOptions.squad.delivery === 'express') ? `Express (+${convertPrice(13)})` : 'Normal';
    const paymentText = (serviceOptions.squad && serviceOptions.squad.payment) ? serviceOptions.squad.payment : 'paypal';
    const platformText = (serviceOptions.squad && serviceOptions.squad.platform === 'xbox') ? `Xbox (+${convertPrice(10)})` : 'PlayStation';

    // Optional: Log to server
    logOrderToServer(orderNumber, 'Squad Battle', email, price);

    let message = `🎮 QBoosting Order #${orderNumber}

Service: Squad Battle
Target Rank: ${rank}
Platform: ${platformText}
Delivery: ${deliveryText}
Payment Method: ${paymentText}
Email: ${email}`;

    // Add promo if applied
    if (appliedPromos.squad) {
        message += `\nPromo Code: ${appliedPromos.squad.code} ✅`;
    }

    message += `\nFinal Price: ${price}

⚠️ Important: Squad Battle matches must be started fresh by our booster.

Ready to start when you confirm! 🚀`;

    window.open(`https://t.me/QBoostingHelp?text=${encodeURIComponent(message)}`, '_blank');
    
    setTimeout(() => {
    processingOrder = false;
    resetOrderButton(orderBtn, 'Order Now');
}, 3000); // Changed from 2000 to 3000 (3 seconds max)
}

// Evolution Logic
function initEvolution() {
    const evoNumberSelect = document.getElementById('evo-number');
    evoNumberSelect.addEventListener('change', updateEvoPrice);
}

function updateEvoPrice() {
    const evoNumberOption = document.getElementById('evo-number').selectedOptions[0];

    if (evoNumberOption && evoNumberOption.value) {
        let originalPriceUSD = parseInt(evoNumberOption.value);
        const evoText = evoNumberOption.textContent;

        // Add Xbox platform cost (in USD)
        if (serviceOptions.evo && serviceOptions.evo.platform === 'xbox') {
            originalPriceUSD += 10;
        }

        // Add express delivery cost (in USD)
        if (serviceOptions.evo && serviceOptions.evo.delivery === 'express') {
            originalPriceUSD += 13;
        }

        // Apply discount
        const finalPriceUSD = applyDiscount(originalPriceUSD, 'evo');

        // Convert to current currency
        const finalPriceConverted = convertPrice(finalPriceUSD);

        // Update price display
        document.getElementById('evo-price-amount').textContent = finalPriceConverted;
        document.getElementById('evo-currency').textContent = currentCurrency;
        document.getElementById('evo-price').style.display = 'block';
        document.getElementById('evo-promo-section').style.display = 'block';

        const deliveryText = (serviceOptions.evo && serviceOptions.evo.delivery === 'express') ? getExpressCostText() : 'Normal';
        const paymentText = (serviceOptions.evo && serviceOptions.evo.payment) ? serviceOptions.evo.payment : 'paypal';
        const platformText = (serviceOptions.evo && serviceOptions.evo.platform === 'xbox') ? getXboxCostText() : 'PlayStation';

        let summaryContent = `
            <div class="summary-item"><span>Service:</span><span>Evolution</span></div>
            <div class="summary-item"><span>Number of EVOs:</span><span>${evoText}</span></div>
            <div class="summary-item"><span>Platform:</span><span>${platformText}</span></div>
            <div class="summary-item"><span>Delivery:</span><span>${deliveryText}</span></div>
            <div class="summary-item"><span>Payment:</span><span>${paymentText}</span></div>`;

        // Add promo if applied
        if (appliedPromos.evo) {
            const savedAmountUSD = originalPriceUSD - finalPriceUSD;
            const savedAmountConverted = convertDiscount(savedAmountUSD);
            summaryContent += `<div class="summary-item"><span>Promo Code:</span><span style="color: #28a745;">${appliedPromos.evo.code} (-${savedAmountConverted})</span></div>`;
        }

        summaryContent += `<div class="summary-item"><span>Final Price:</span><span>${finalPriceConverted}</span></div>`;

        document.getElementById('evo-summary-content').innerHTML = summaryContent;
        document.getElementById('evo-summary').style.display = 'block';

        const orderBtn = document.getElementById('evo-order-btn');
        orderBtn.disabled = false;
        orderBtn.textContent = 'Order Now';
        orderBtn.onclick = () => orderEvolution(evoText, finalPriceConverted);
    } else {
        document.getElementById('evo-price').style.display = 'none';
        document.getElementById('evo-promo-section').style.display = 'none';
        document.getElementById('evo-summary').style.display = 'none';
        document.getElementById('evo-order-btn').disabled = true;
        document.getElementById('evo-order-btn').textContent = 'Select all options first';
    }
}

async function orderEvolution(evoText, price) {
if (processingOrder) return;
    
    // IMMEDIATELY disable button and show feedback
    const orderBtn = document.getElementById('evo-order-btn');
    if (orderBtn.disabled) return; // Prevent duplicate clicks
    
    orderBtn.disabled = true;
    orderBtn.textContent = 'Processing...';
    orderBtn.style.opacity = '0.6'; // Visual feedback
    
    processingOrder = true;
    
    if (!validateEmail('evo')) {
        // Reset button and processing state if validation fails
        orderBtn.disabled = false;
        orderBtn.textContent = 'Order Now';
        orderBtn.style.opacity = '1';
        processingOrder = false;
        return;
    }
    
    const orderNumber = await getNextOrderNumber();
    const email = document.getElementById('evo-email').value || 'Not provided';
    const deliveryText = (serviceOptions.evo && serviceOptions.evo.delivery === 'express') ? `Express (+${convertPrice(13)})` : 'Normal';
    const paymentText = (serviceOptions.evo && serviceOptions.evo.payment) ? serviceOptions.evo.payment : 'paypal';
    const platformText = (serviceOptions.evo && serviceOptions.evo.platform === 'xbox') ? `Xbox (+${convertPrice(10)})` : 'PlayStation';

    // Optional: Log to server
    logOrderToServer(orderNumber, 'Evolution', email, price);

    let message = `🎮 QBoosting Order #${orderNumber}

Service: Evolution
Number of EVOs: ${evoText}
Platform: ${platformText}
Delivery: ${deliveryText}
Payment Method: ${paymentText}
Email: ${email}`;

    // Add promo if applied
    if (appliedPromos.evo) {
        message += `\nPromo Code: ${appliedPromos.evo.code} ✅`;
    }

    message += `\nFinal Price: ${price}

Ready to start when you confirm! 🚀`;

    window.open(`https://t.me/QBoostingHelp?text=${encodeURIComponent(message)}`, '_blank');
    
   setTimeout(() => {
    processingOrder = false;
    resetOrderButton(orderBtn, 'Order Now');
}, 3000); // Changed from 2000 to 3000 (3 seconds max)
}

// Subscription Logic
function initSubscription() {
    const serviceTypeSelect = document.getElementById('sub-service-type');
    const rankDivSelect = document.getElementById('sub-rank-div');

    serviceTypeSelect.addEventListener('change', updateRankDivOptions);
    rankDivSelect.addEventListener('change', updateSubPrice);
}

function updateRankDivOptions() {
    const serviceType = document.getElementById('sub-service-type').value;
    const rankDivSelect = document.getElementById('sub-rank-div');

    rankDivSelect.innerHTML = '<option value="">Select Rank/Division</option>';

    if (serviceType === 'fut-1' || serviceType === 'fut-3') {
        // FUT Champions ranks
        const ranks = [
            { value: 'rank1', name: 'Rank 1', price: serviceType === 'fut-1' ? 350 : 950 },
            { value: 'rank2', name: 'Rank 2', price: serviceType === 'fut-1' ? 320 : 860 },
            { value: 'rank3', name: 'Rank 3', price: serviceType === 'fut-1' ? 290 : 780 },
            { value: 'rank4', name: 'Rank 4', price: serviceType === 'fut-1' ? 250 : 670 }
        ];

        ranks.forEach(rank => {
            rankDivSelect.innerHTML += `<option value="${rank.price}" data-name="${rank.name}">${rank.name}</option>`;
        });
    } else if (serviceType === 'rivals-1' || serviceType === 'rivals-3') {
        // Rivals divisions
        const divisions = [
            { value: 'elite', name: 'Elite', price: serviceType === 'rivals-1' ? 220 : 600 },
            { value: 'div1', name: 'Division 1', price: serviceType === 'rivals-1' ? 200 : 540 },
            { value: 'div2', name: 'Division 2', price: serviceType === 'rivals-1' ? 180 : 490 },
            { value: 'div3', name: 'Division 3', price: serviceType === 'rivals-1' ? 160 : 430 },
            { value: 'div4', name: 'Division 4', price: serviceType === 'rivals-1' ? 140 : 380 },
            { value: 'div5', name: 'Division 5', price: serviceType === 'rivals-1' ? 120 : 325 },
            { value: 'div6', name: 'Division 6', price: serviceType === 'rivals-1' ? 100 : 270 }
        ];

        divisions.forEach(div => {
            rankDivSelect.innerHTML += `<option value="${div.price}" data-name="${div.name}">${div.name}</option>`;
        });
    }

    updateSubPrice();
}

function updateSubPrice() {
    const serviceType = document.getElementById('sub-service-type').value;
    const rankOption = document.getElementById('sub-rank-div').selectedOptions[0];

    if (serviceType && rankOption && rankOption.value) {
        let originalPriceUSD = parseInt(rankOption.value);
        const rankName = rankOption.dataset.name;

        // Add Xbox platform cost
        if (serviceOptions.sub && serviceOptions.sub.platform === 'xbox') {
            originalPriceUSD += 30;
        }

        // Apply discount
        const finalPriceUSD = applyDiscount(originalPriceUSD, 'sub');

        // Convert to current currency
        const finalPriceConverted = convertPrice(finalPriceUSD);

        // Update price display
        document.getElementById('sub-price-amount').textContent = finalPriceConverted;
        document.getElementById('sub-currency').textContent = currentCurrency;
        document.getElementById('sub-price').style.display = 'block';
        document.getElementById('sub-promo-section').style.display = 'block';

        // Service type display name
        const serviceNames = {
            'fut-1': 'FUT Champion 1 Month',
            'fut-3': 'FUT Champion 3 Month',
            'rivals-1': 'Rivals Weekly Rewards 1 Month',
            'rivals-3': 'Rivals Weekly Rewards 3 Month'
        };

        const platformText = (serviceOptions.sub && serviceOptions.sub.platform === 'xbox') ? getXboxSubCostText() : 'PlayStation';
        const paymentText = (serviceOptions.sub && serviceOptions.sub.payment) ? serviceOptions.sub.payment : 'paypal';

        let summaryContent = `
            <div class="summary-item"><span>Service:</span><span>Subscription</span></div>
            <div class="summary-item"><span>Type:</span><span>${serviceNames[serviceType]}</span></div>
            <div class="summary-item"><span>Rank/Division:</span><span>${rankName}</span></div>
            <div class="summary-item"><span>Platform:</span><span>${platformText}</span></div>
            <div class="summary-item"><span>Payment:</span><span>${paymentText}</span></div>`;

        // Add promo if applied
        if (appliedPromos.sub) {
            const savedAmountUSD = originalPriceUSD - finalPriceUSD;
            const savedAmountConverted = convertDiscount(savedAmountUSD);
            summaryContent += `<div class="summary-item"><span>Promo Code:</span><span style="color: #28a745;">${appliedPromos.sub.code} (-${savedAmountConverted})</span></div>`;
        }

        summaryContent += `<div class="summary-item"><span>Final Price:</span><span>${finalPriceConverted}</span></div>`;

        document.getElementById('sub-summary-content').innerHTML = summaryContent;
        document.getElementById('sub-summary').style.display = 'block';

        const orderBtn = document.getElementById('sub-order-btn');
        orderBtn.disabled = false;
        orderBtn.textContent = 'Order Now';
        orderBtn.onclick = () => orderSubscription(serviceNames[serviceType], rankName, finalPriceConverted);
    } else {
        document.getElementById('sub-price').style.display = 'none';
        document.getElementById('sub-promo-section').style.display = 'none';
        document.getElementById('sub-summary').style.display = 'none';
        document.getElementById('sub-order-btn').disabled = true;
        document.getElementById('sub-order-btn').textContent = 'Select all options first';
    }
}

async function orderSubscription(serviceType, rankName, price) {
if (processingOrder) return;
    
    // IMMEDIATELY disable button and show feedback
    const orderBtn = document.getElementById('sub-order-btn');
    if (orderBtn.disabled) return; // Prevent duplicate clicks
    
    orderBtn.disabled = true;
    orderBtn.textContent = 'Processing...';
    orderBtn.style.opacity = '0.6'; // Visual feedback
    
    processingOrder = true;
    
    if (!validateEmail('sub')) {
        // Reset button and processing state if validation fails
        orderBtn.disabled = false;
        orderBtn.textContent = 'Order Now';
        orderBtn.style.opacity = '1';
        processingOrder = false;
        return;
    }
    
    const orderNumber = await getNextOrderNumber();
    const email = document.getElementById('sub-email').value;
    const platformText = (serviceOptions.sub && serviceOptions.sub.platform === 'xbox') ? `Xbox (+${convertPrice(30)})` : 'PlayStation';
    const paymentText = (serviceOptions.sub && serviceOptions.sub.payment) ? serviceOptions.sub.payment : 'paypal';

     // Optional: Log to server
    logOrderToServer(orderNumber, 'Subscription', email, price);

    let message = `🎮 QBoosting Subscription Order #${orderNumber}

Service: ${serviceType}
Rank/Division: ${rankName}
Platform: ${platformText}
Payment Method: ${paymentText}
Email: ${email}`;

    // Add promo if applied
    if (appliedPromos.sub) {
        message += `\nPromo Code: ${appliedPromos.sub.code} ✅`;
    }

    message += `\nFinal Price: ${price}

Ready to start when you confirm! 🚀`;

    window.open(`https://t.me/QBoostingHelp?text=${encodeURIComponent(message)}`, '_blank');
    
    setTimeout(() => {
    processingOrder = false;
    resetOrderButton(orderBtn, 'Order Now');
}, 3000); // Changed from 2000 to 3000 (3 seconds max)
}

function validateEmail(service) {
    const emailInput = document.getElementById(`${service}-email`);
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
document.querySelectorAll('input[type="email"]').forEach(input => {
    input.addEventListener('input', function () {
        this.classList.remove('error');
    });
});

document.querySelectorAll('.tooltip-container').forEach(function (el) {
    el.addEventListener('click', function (e) {
        e.stopPropagation();
        document.querySelectorAll('.tooltip-container').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
    });
});
document.addEventListener('click', function () {
    document.querySelectorAll('.tooltip-container').forEach(t => t.classList.remove('active'));
});