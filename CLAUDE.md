# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a static website for QBoosting, a FIFA/FC26 boosting service provider. The site is built with vanilla HTML, CSS, and JavaScript and is hosted on GitHub Pages.

## Architecture

### Core Structure
- **Frontend-only**: Pure client-side application with no backend server
- **Single Page Application (SPA)**: Dynamic content switching using JavaScript
- **Static hosting**: Deployed on GitHub Pages

### Key Files
- `index.html` - Main HTML file containing all page content
- `assets/js/main.js` - Primary JavaScript file handling all functionality
- `assets/css/main.css` - Main stylesheet with responsive design
- `assets/css/` - Additional stylesheets for components (buttons, tooltips, promo)

### External Dependencies
- **Font Awesome 6.0.0** - For icons
- **Google Analytics** - User tracking
- **Tawk.to** - Customer support chat widget
- **Exchange Rate API** - Currency conversion
- **Google Apps Script** - Order management and promo code validation

## Development Workflow

### Local Development
Since this is a static site, you can:
1. Open `index.html` directly in a browser for basic testing
2. Use a local server (e.g., `python -m http.server 8000`) for proper testing
3. Test all JavaScript functionality works with CORS restrictions

### No Build Process
- No package.json or build tools
- Direct HTML/CSS/JS editing
- Changes are immediately reflected when files are saved

## Key Features & Architecture

### Service Management
- Multiple boosting services (FUT Champions, Division Rivals, Draft, etc.)
- Dynamic pricing system with platform and delivery speed modifiers
- Real-time price calculations in multiple currencies (USD, EUR, GBP)

### Order System
- Pre-generated order numbers from Google Apps Script
- Order details formatted for Telegram integration
- Local storage for order counter fallback

### Promo Code System
- Server-side validation via Google Apps Script
- Support for both percentage and fixed-amount discounts
- Real-time discount calculation and display

### State Management
- JavaScript object `serviceOptions` tracks user selections
- `appliedPromos` object manages active promotional codes
- Currency conversion handled via live exchange rates

## External Integrations

### Google Apps Script Endpoints
- Order number generation: Used for unique order tracking
- Promo code validation: Validates and returns discount information
- Order logging: Optional server-side order tracking

### Third-party Services
- Exchange Rate API: Real-time currency conversion
- Telegram: Customer communication via deep links
- Trustpilot: Customer reviews integration

## Important Notes

### Security Considerations
- All sensitive operations handled server-side via Google Apps Script
- No payment processing on client-side
- Email validation before order submission

### Responsive Design
- Mobile-first approach with responsive breakpoints
- Touch-friendly interface for mobile users
- Collapsible navigation for smaller screens

### Performance
- Pre-generation of order numbers for faster user experience
- Lightweight vanilla JavaScript (no frameworks)
- Optimized image loading and caching headers