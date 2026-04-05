# Online Bakery Ordering - Feature Research & Ideas

Research conducted on 2026-04-04 from two platforms:
- **OrderEm** (https://orderem.com/Business-types/Bakeries) - B2B online ordering platform for bakeries
- **Zesty Bakers** (https://zestybakers.com/) - B2C marketplace connecting customers with local independent bakers

---

## 1. Menu Management

### Found on OrderEm
- Dynamic menu updates from any mobile device, reflected instantly on online ordering
- Toggle items active/inactive when stock is unavailable (real-time availability)
- Add new items and adjust details (price, description, images) on the fly
- Menu upload assistance (PDF/Excel/image formats accepted)
- Template-based storefront with multiple design options (Simple, Classic, Modern, Colorful)

### Found on Zesty Bakers
- Product categories: Cakes, Cupcakes, Cake Pops, Cookies, Chocolate, Pastries, Cake Loaf, Pies
- Per-baker product catalogs with individual storefronts ("Visit Store")
- Product cards showing: name, price, baker name, distance, rating, photo
- Corporate catalog as a separate section with dedicated product listings

### Ideas for Bake App
- **Online menu publishing**: Expose existing menu/product data as a customer-facing online storefront
- **Real-time stock sync**: Connect inventory module to online menu so out-of-stock items auto-hide
- **Category-based browsing**: Leverage existing Category model for intuitive customer navigation
- **Product images gallery**: Multiple photos per product (whole, slice, detail)
- **Seasonal/rotating menus**: Time-based menu visibility (e.g., holiday specials, weekly rotations)
- **Menu item badges**: "New", "Popular", "Limited", "Back in Stock"

---

## 2. Item Customization

### Found on OrderEm
- Customers can "design their own orders"
- Option sets to select from (size, flavor, toppings, etc.)
- Free-text field for cake inscriptions ("describe exactly what they want written on a cake")

### Found on Zesty Bakers
- Cake size selector (4 inch, 6 inch)
- Flavor options (Almond, Coconut, etc.)
- Cake filling choices (Almond, Pineapple, Chocolate, Vanilla)
- Icing type selection (Coconut, Buttermilk, Caramel, Vanilla)
- Decoration description (free text)
- Inspiration photo upload ("Drop image here or click to upload")
- Serving size selection (10-15, 20-30, 30-40, 40-50 people)
- Theme/color scheme specification
- Event type specification

### Ideas for Bake App
- **Product variants/options**: Size, flavor, filling, icing as configurable option groups per product
- **Custom text field**: Cake inscription input with character limit
- **Image upload for custom orders**: Let customers attach reference photos
- **Serving size calculator**: Auto-suggest cake size based on guest count
- **Custom order request form**: For bespoke cakes not on the standard menu
- **Option pricing**: Different prices per variant (size affects price, premium flavors cost extra)
- **Visual cake builder**: Step-by-step configurator showing layers, filling, icing, decorations

---

## 3. Scheduling & Pre-ordering

### Found on OrderEm
- Set preparation time per product category (cakes vs cookies vs buns have different lead times)
- Customers must place orders with enough notice based on prep time
- Advance ordering built into the ordering flow

### Found on Zesty Bakers
- Date picker on homepage and product pages for selecting delivery/pickup date
- Availability calendar showing which dates products are available
- Per-product available dates displayed ("Also available on Mon, Jun 26 / Tue, Jun 27...")
- Certain dates blocked/disabled in the date picker (e.g., today and tomorrow disabled)
- Minimum lead time enforced (earliest available date is ~1 week out)

### Ideas for Bake App
- **Per-category prep time**: Configure minimum lead time per product category
- **Availability calendar**: Visual calendar showing which products are available on which dates
- **Production capacity limits**: Max orders per day/timeslot based on production capacity
- **Cutoff times**: Order-by time for next-day availability (e.g., order by 6pm for tomorrow)
- **Recurring orders**: Allow customers to set up weekly/monthly repeat orders
- **Pre-order queue**: Connect to production planning module for automatic task generation
- **Holiday schedule**: Block dates when bakery is closed, special holiday hours

---

## 4. Customer Accounts & Authentication

### Found on OrderEm
- Customer management system
- Customer registration and login
- Customer data/CRM for marketing

### Found on Zesty Bakers
- Sign In / Register flow
- Customer account area ("My Account")
- Order history accessible from account
- Address saved in profile for delivery

### Ideas for Bake App
- **Customer-facing auth**: Separate from staff auth, customer registration with email/phone
- **Guest checkout**: Allow ordering without account creation
- **Order history**: Past orders with easy re-order capability
- **Saved addresses**: Multiple delivery addresses per customer
- **Favorites/wishlist**: Save frequently ordered items
- **Customer profiles**: Dietary preferences, allergies, birthday stored for personalization

---

## 5. Notifications

### Found on OrderEm
- Push notifications as a marketing channel
- Order status notifications for customers

### Found on Zesty Bakers
- (Implied) Order confirmation and status updates

### Ideas for Bake App
- **Order confirmation**: Email/SMS when order is placed
- **Status updates**: "Preparing", "Baking", "Ready for pickup", "Out for delivery"
- **Pickup reminders**: Notify customer when order is ready
- **Delivery tracking**: Real-time driver location updates
- **Marketing push notifications**: New products, seasonal specials, promotions
- **Abandoned cart reminders**: Nudge customers who started but did not complete an order
- **Reorder reminders**: "It's been a month since your last order" prompts
- Connect to existing WebSocket infrastructure for real-time updates

---

## 6. Loyalty Programs & Marketing

### Found on OrderEm
- Full loyalty program with points system
- Coupons and discount codes
- Gift cards
- BOGO (Buy One Get One) promotions
- Cross-sell recommendations
- Push notification campaigns
- Points redemption across all sales channels (online and in-store)
- Customer referral program (friend referrals)
- Loyalty management dashboard
- "Boosting customer retention by 5% can increase revenue by 25-95%"

### Found on Zesty Bakers
- Customer reviews and ratings (5-star system)
- Featured bakers section (highlighting top performers)
- Community events ("Cake Meet" - in-person events for engagement)

### Ideas for Bake App
- **Points-based loyalty**: Earn points per dollar spent, redeem for discounts or free items
- **Punch card digital equivalent**: "Buy 10 coffees, get 1 free" style programs
- **Tiered rewards**: Bronze/Silver/Gold customer levels with increasing perks
- **Birthday rewards**: Auto-discount or free item on customer's birthday
- **Referral program**: Share a code, both referrer and friend get a discount
- **Gift cards**: Digital gift cards purchasable online, redeemable in POS
- **Coupons engine**: Percentage off, fixed amount off, free item, minimum order thresholds
- **Cross-sell suggestions**: "Customers who bought X also bought Y"
- **Review system**: Post-order review prompts, star ratings, photo reviews
- **BOGO promotions**: Configurable buy-one-get-one deals

---

## 7. Dietary Tags & Allergen Information

### Found on OrderEm
- (Not explicitly detailed on bakeries page)

### Found on Zesty Bakers
- "Dietary Needs" badge on baker profiles
- Dietary instruction options at checkout: None, Gluten Free, Sugar Free, Eggs Free, Nuts Free, Kitto (Keto)
- "Customize based on your needs, preferences, and dietary restrictions"
- Additional charge for dietary modifications noted: "Additional charge than base pricing"
- "Any dietary restrictions?" field on custom request form

### Ideas for Bake App
- **Allergen tags per product**: Gluten, Dairy, Eggs, Nuts, Soy, etc.
- **Dietary labels**: Vegan, Vegetarian, Gluten-Free, Sugar-Free, Keto, Halal, Kosher
- **Allergen filter**: Let customers filter menu by dietary requirements
- **Allergen warnings**: Prominent display on product detail and checkout
- **Ingredient transparency**: Full ingredient list visible per product (leverage existing Recipe/RecipeIngredient data)
- **Cross-contamination notices**: "Made in a facility that also processes nuts"
- **Dietary surcharges**: Support price adjustments for specialty dietary versions

---

## 8. Special Occasion Ordering

### Found on OrderEm
- Birthday cakes, wedding cakes mentioned as key bakery use cases
- Custom text on cakes (inscriptions)

### Found on Zesty Bakers
- "What is your event?" field on custom request form
- Theme/color scheme specification
- Serving size by guest count (10-15, 20-30, 30-40, 40-50 people)
- Inspiration photo upload
- Custom decoration description
- Community events ("Cake Meet" - tasting events, vote and join)
- Corporate orders as a distinct category

### Ideas for Bake App
- **Occasion-based ordering flow**: Birthday, Wedding, Anniversary, Baby Shower, Corporate Event, Holiday
- **Event planner mode**: Enter event date, guest count, budget -- get product suggestions
- **Custom cake request workflow**: Multi-step form with design, flavor, size, inscription, photo reference
- **Corporate/bulk ordering portal**: Separate flow for large orders with volume pricing
- **Catering packages**: Bundled assortments (e.g., "Party Pack: 2 dozen cupcakes + 1 cake")
- **Wedding cake consultation booking**: Schedule a tasting appointment through the platform
- **Occasion reminders**: "Your anniversary is next week - order a cake?"

---

## 9. Delivery & Pickup Options

### Found on OrderEm
- Delivery with zone-based pricing
- Extended delivery zones with separate requirements
- Takeout/pickup
- Curbside pickup
- Drive-thru
- In-seat ordering
- In-room ordering
- Catering delivery
- Shipping (for shelf-stable items)
- DeliverEm driver management app with real-time tracking
- Smart driver management and performance tracking
- Multi-location support with unified management

### Found on Zesty Bakers
- Delivery available per baker (noted on product cards)
- Distance-based baker discovery ("1.5 Miles")
- Zipcode-based search for local bakers
- Address-based search
- Delivery address field on custom requests

### Ideas for Bake App
- **Pickup scheduling**: Select date and time slot for in-store pickup
- **Delivery zones**: Define geographic zones with different delivery fees
- **Delivery time slots**: Offer specific time windows (morning, afternoon, evening)
- **Curbside pickup**: Customer notifies arrival, staff brings order out
- **Shipping for non-perishables**: Cookies, dry goods can be shipped further
- **Delivery fee calculator**: Distance or zone-based automatic fee calculation
- **Multi-location pickup**: Customer selects which bakery location for pickup
- **Real-time order tracking**: Integrate with existing WebSocket for live status updates
- **Third-party delivery integration**: DoorDash Drive, Uber Direct API for outsourced delivery

---

## 10. Storefront & Branding

### Found on OrderEm
- Custom branded website builder with templates
- Custom branded mobile app (iOS and Android)
- Self-service kiosk software
- Facebook ordering integration
- Company logo, colors, and fonts customization
- Multiple template styles (Simple, Classic, Modern, Colorful)
- POS integration

### Found on Zesty Bakers
- Marketplace model with individual baker storefronts
- Location-based discovery (zipcode and address search)
- Baker profiles with name, store name, photo, rating, distance
- WooCommerce-based e-commerce platform
- Social media integration (Instagram, Facebook)

### Ideas for Bake App
- **Customer-facing web app**: New frontend at `order.bake.ilia.to` for online ordering
- **Customizable storefront**: Logo, colors, hero images configurable from admin
- **Mobile-responsive ordering**: Optimized for phone ordering
- **QR code ordering**: Generate QR codes for tables/menus that link to the online ordering page
- **Social media integration**: Share products, link Instagram feed on storefront
- **Google Maps integration**: Show bakery location, delivery zone overlay
- **SEO-friendly product pages**: Individual URLs per product for search engine visibility

---

## 11. Payments & Checkout

### Found on OrderEm
- Online payment processing
- POS integration for in-store payments
- Multi-channel payment support

### Found on Zesty Bakers
- Cart system with item count
- Multi-step checkout (product selection -> customization -> checkout)
- WooCommerce payment processing (supports Stripe, PayPal, etc.)

### Ideas for Bake App
- **Online payment gateway**: Stripe integration for card payments
- **Deposit/partial payment**: Collect deposit for custom orders, balance on pickup
- **Tipping option**: Add tip at checkout
- **Split payment**: Pay partially online, partially at pickup
- **Order total transparency**: Itemized subtotal, tax, delivery fee, discount, tip, total
- **Saved payment methods**: Returning customers can pay faster
- **Invoice generation**: For corporate/bulk orders

---

## 12. Order Management (Customer-Facing)

### Found on OrderEm
- Cloud-based order management across all channels
- Unified sales management
- Real-time order tracking

### Found on Zesty Bakers
- Quote request system for custom orders (multi-baker quoting)
- "Receive transparent quotes from multiple bakers and finalize quickly"

### Ideas for Bake App
- **Order status page**: Public URL per order showing real-time status
- **Order modification**: Allow changes within a time window before production starts
- **Order cancellation**: Self-service cancellation with refund policy
- **Re-order**: One-click reorder from order history
- **Quote workflow for custom cakes**: Customer submits request -> baker quotes -> customer approves -> order created
- **Order notes**: Customer can add special instructions

---

## Common Patterns Across Both Platforms

1. **Location awareness** - Both emphasize local/proximity-based discovery
2. **Visual product presentation** - High-quality photos are essential for bakery items
3. **Customization is king** - Bakery customers expect to personalize orders (size, flavor, inscription, decoration)
4. **Advance ordering required** - Baked goods need lead time; scheduling is not optional
5. **Multiple fulfillment methods** - Pickup and delivery are both expected
6. **Customer reviews build trust** - Ratings and testimonials drive purchasing decisions
7. **Mobile-first approach** - Both platforms prioritize mobile experience
8. **Marketing/retention tools** - Loyalty programs, coupons, and push notifications are standard
9. **Corporate/bulk ordering** - Separate workflows for large/business orders
10. **Dietary accommodation** - Allergen and dietary information is increasingly expected

---

## Priority Recommendations for Bake App

### Phase 1 - Core Online Ordering
- Customer-facing storefront (new React app)
- Product browsing with categories and images
- Shopping cart and basic checkout
- Pickup scheduling with date/time selection
- Order status tracking (leverage existing WebSocket)

### Phase 2 - Customization & Scheduling
- Product options/variants (size, flavor, etc.)
- Custom cake request form with photo upload
- Prep time and lead time enforcement
- Dietary tags and allergen filters
- Customer accounts with order history

### Phase 3 - Delivery & Marketing
- Delivery zone management and fee calculation
- Loyalty points program
- Coupon/discount engine
- Push notifications and email marketing
- Gift cards

### Phase 4 - Advanced Features
- Corporate ordering portal
- Recurring orders
- Multi-baker marketplace (if expanding beyond single bakery)
- Advanced analytics on online ordering performance
- Third-party delivery integration
