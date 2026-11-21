import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Award, BadgeCheck, ChevronLeft, ChevronRight, Menu, Minus, Phone, Plus, ShoppingCart, ShieldCheck, Soup, Store, Truck, Upload, X } from 'lucide-react'
import { business } from './data/business'
import { categories } from './data/categories'
import { copy } from './data/copy'
import { deliveryFees, products } from './data/prices'
import { reviews } from './data/reviews'
import { formatNaira } from './utils/formatNaira'
import { cartTotals, clampQty, lineTotal } from './utils/pricing'
import { makeImageThumb } from './utils/imageThumb'

const defaultSelection = (product) => ({
  size: product.sizes[0].name,
  choices: Object.fromEntries(product.choices.map((choice) => [choice.name, choice.default ?? choice.options[0]])),
  addons: Object.fromEntries((product.addons || []).map((addon) => [addon.name, 0])),
  note: '',
  inspiration: null,
})

function lineKey(product, selection) {
  return JSON.stringify([product.id, selection.size, selection.choices, selection.addons, selection.note, selection.inspiration?.filename || ''])
}

function whatsappUrl(message) {
  return `https://wa.me/${business.whatsapp}?text=${encodeURIComponent(message)}`
}

function Quantity({ value, onChange, size = 'md' }) {
  const small = size === 'sm'
  return (
    <div className={`qty ${small ? 'qty-sm' : ''}`}>
      <button type="button" aria-label="Decrease quantity" onClick={() => onChange(clampQty(value - 1))}><Minus size={small ? 14 : 16} /></button>
      <input aria-label="Quantity" type="number" min="1" max="500" value={value} onChange={(event) => onChange(clampQty(event.target.value))} onBlur={(event) => onChange(clampQty(event.target.value))} />
      <button type="button" aria-label="Increase quantity" onClick={() => onChange(clampQty(value + 1))}><Plus size={small ? 14 : 16} /></button>
    </div>
  )
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [customize, setCustomize] = useState(null)
  const [lightbox, setLightbox] = useState(null)
  const [toast, setToast] = useState('')
  const [filter, setFilter] = useState('All')
  const [cardQty, setCardQty] = useState(() => Object.fromEntries(products.map((product) => [product.id, 1])))
  const [checkout, setCheckout] = useState(false)
  const [thankYou, setThankYou] = useState(false)
  const [reviewIndex, setReviewIndex] = useState(0)
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('zab-cart') || '[]').filter((line) => line?.product?.id) } catch { return [] }
  })

  useEffect(() => {
    try { localStorage.setItem('zab-cart', JSON.stringify(cart)) } catch { /* Storage can be unavailable */ }
  }, [cart])

  useEffect(() => {
    const blocked = menuOpen || cartOpen || customize || lightbox
    document.body.style.overflow = blocked ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen, cartOpen, customize, lightbox])

  useEffect(() => {
    if (menuOpen || cartOpen || customize || lightbox) return
    const timer = window.setInterval(() => setReviewIndex((index) => (index + 1) % reviews.length), 5000)
    return () => window.clearInterval(timer)
  }, [menuOpen, cartOpen, customize, lightbox])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 2200)
    return () => window.clearTimeout(timer)
  }, [toast])

  const cartCount = cart.reduce((sum, line) => sum + line.qty, 0)
  const visibleProducts = filter === 'All' ? products : products.filter((product) => product.category === filter)

  const scrollTo = (id) => {
    setMenuOpen(false)
    document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  const addLine = (product, selection, qty, editLineId) => {
    setCart((current) => {
      if (editLineId) {
        const updated = { product, selection, qty: clampQty(qty), id: editLineId }
        return current.map((line) => line.id === editLineId ? updated : line)
      }
      const id = `${product.id}-${Date.now()}`
      const existing = current.find((line) => line.product.id === product.id && lineKey(line.product, line.selection) === lineKey(product, selection))
      if (existing) return current.map((line) => line.id === existing.id ? { ...line, qty: clampQty(line.qty + qty) } : line)
      return [...current, { product, selection, qty: clampQty(qty), id }]
    })
    setCustomize(null)
    setToast('Added to your cart')
  }

  const openCustomize = (product, existingLine = null) => {
    setCustomize(existingLine
      ? { product, line: existingLine, selection: structuredClone(existingLine.selection), qty: existingLine.qty }
      : { product, line: null, selection: defaultSelection(product), qty: 1 })
  }

  const filteredCategory = (category) => {
    setFilter(category.filter)
    scrollTo('#featured')
  }

  return (
    <div>
      <div className="announcement">Freshly made to order <span>•</span> 24 hours pre-order notice <span>•</span> Osogbo, Osun State</div>
      <header className="header">
        <button className="icon-btn" aria-label="Open menu" onClick={() => setMenuOpen(true)}><Menu /></button>
        <button className="logo-button" aria-label="Home" onClick={() => scrollTo('#top')}><img src="/images/logo.png" alt="Home Menu by Zab" /></button>
        <div className="header-actions">
          <a className="icon-btn" aria-label="Call Home Menu by Zab" href={`tel:${business.tel}`}><Phone /></a>
          <button className="icon-btn cart-button" aria-label={`Open cart with ${cartCount} items`} onClick={() => { setCartOpen(true); setThankYou(false); setCheckout(false) }}>
            <ShoppingCart /><b>{cartCount}</b>
          </button>
        </div>
      </header>

      {menuOpen && <MenuDrawer close={() => setMenuOpen(false)} scrollTo={scrollTo} />}

      <main id="top">
        <section className="hero section-shell">
          <div className="hero-image"><img src="/images/hero-butternut-soup.jpg" alt="Butternut soup in a white bowl with toasted bread" /></div>
          <div className="hero-copy">
            <p className="eyebrow">{copy.hero.eyebrow}</p>
            <h1>{copy.hero.headline}</h1>
            <p className="hero-sub">{copy.hero.subtext}</p>
            <div className="hero-buttons">
              <button className="btn btn-primary" onClick={() => scrollTo('#featured')}>Order Now</button>
              <button className="btn btn-outline" onClick={() => scrollTo('#tailored')}>Customize Your Meal</button>
            </div>
            <div className="trust-row"><span><BadgeCheck /> CAC Registered</span><span><ShieldCheck /> Food Safety Certified</span></div>
          </div>
        </section>

        <section className="stats">
          {[['CAC Registered','BN 7228343'],['Food Safety Certified','Level 2 Award'],['Soups by the Litre','Bowls to bulk orders'],['24 Hours','Pre-order notice']].map((item) => (
            <div key={item[0]}><strong>{item[0]}</strong><span>{item[1]}</span></div>
          ))}
        </section>

        <section className="section-shell categories-section">
          <div className="section-heading"><div><h2>{copy.categoriesHeading}</h2><p>{copy.categoriesSub}</p></div></div>
          <div className="category-grid">
            {categories.map((category) => (
              <button className="category-card" key={category.name} onClick={() => filteredCategory(category)}>
                <img src={category.image} alt={category.name} loading="lazy" />
                <div className="category-overlay" />
                <div className="category-copy"><strong>{category.name}</strong><span>{category.description}</span></div>
                <span className="category-arrow"><ArrowRight /></span>
              </button>
            ))}
          </div>
        </section>

        <section className="section-shell featured" id="featured">
          <div className="section-heading"><div><h2>{copy.featuredHeading}</h2><p>{copy.featuredSub}</p></div></div>
          <div className="filters" role="tablist" aria-label="Menu filters">
            {['All','Soups','Rice','Sides','Salads','Pastries','Trays'].map((item) => <button role="tab" aria-selected={filter === item} className={filter === item ? 'active' : ''} key={item} onClick={() => setFilter(item)}>{item}</button>)}
          </div>
          <div className="product-grid">
            {visibleProducts.map((product) => {
              const selection = defaultSelection(product)
              const qty = cardQty[product.id]
              const price = lineTotal(product, selection, qty)
              return (
                <article className="product-card" key={product.id}>
                  <div className="product-image"><img src={product.image} alt={product.name} loading="lazy" /></div>
                  <div className="product-body">
                    <h3>{product.name}</h3><p>{product.description}</p>
                    <p className="from-price">From {formatNaira(Math.min(...product.sizes.map((size) => size.price)))}</p>
                    <Quantity size="sm" value={qty} onChange={(value) => setCardQty((current) => ({ ...current, [product.id]: value }))} />
                    <div className="line-total">Total <strong>{formatNaira(price.total)}</strong></div>
                    {price.discount > 0 && <div className="discount">Bulk saving: {formatNaira(price.discount)}</div>}
                    <button className="btn btn-gold add-button" onClick={() => addLine(product, selection, qty)}>Add to Cart</button>
                    <button className="btn btn-outline customize-button" onClick={() => openCustomize(product)}>Customize</button>
                  </div>
                </article>
              )
            })}
          </div>
          {/* Later, each category card will link to its own category page. */}
        </section>

        <section className="gallery section-shell">
          <h2>From Chef Zabb&apos;s Kitchen</h2>
          <div className="gallery-row">
            {[['/images/puff-puff.jpg','Puff puff with pepper dip'],['/images/focaccia.jpg','Olive focaccia'],['/images/efo-riro.jpg','Efo riro'],['/images/hero-butternut-soup.jpg','Butternut soup with toasted bread']].map(([image, caption]) => (
              <figure key={caption}><img src={image} alt={caption} loading="lazy" /><figcaption>{caption}</figcaption></figure>
            ))}
          </div>
        </section>

        <section className="section-shell how" id="how">
          <div className="section-heading"><h2>How to Order</h2></div>
          <div className="how-grid">
            {[['1','Choose your meal','Pick from the menu or tell us your own idea.',Soup],['2','Customize it','Add notes and an inspiration photo, and set your quantity.',Upload],['3','Send on WhatsApp','Your full order goes to Chef Zabb in one message.',Phone],['4','Fresh to your door','Cooked with 24 hours notice and delivered or ready for pickup.',Truck]].map(([num,title,text,Icon]) => (
              <article key={num}><span>{num}</span><Icon /><h3>{title}</h3><p>{text}</p></article>
            ))}
          </div>
        </section>

        <section className="tailored" id="tailored">
          <div className="section-shell tailored-inner"><div><h2>{copy.tailoredHeading}</h2><p>{copy.tailoredText}</p></div><a className="btn btn-whatsapp" href={whatsappUrl('Hello Chef Zabb, I would like a tailored menu. Here is what I have in mind:')} target="_blank" rel="noreferrer">Tell Chef Zabb What You Want</a></div>
        </section>

        <section className="reviews section-shell" id="reviews">
          <div className="section-heading"><h2>{copy.reviewsHeading}</h2></div>
          <div className="review-wrap">
            <button aria-label="Previous review" onClick={() => setReviewIndex((reviewIndex - 1 + reviews.length) % reviews.length)}><ChevronLeft /></button>
            <div className="review-card"><div className="chat-header"><span /><strong>Customer chat</strong></div><p>{reviews[reviewIndex]}</p></div>
            <button aria-label="Next review" onClick={() => setReviewIndex((reviewIndex + 1) % reviews.length)}><ChevronRight /></button>
          </div>
          <div className="dots">{reviews.map((_, index) => <button aria-label={`Show review ${index + 1}`} className={index === reviewIndex ? 'active' : ''} key={index} onClick={() => setReviewIndex(index)} />)}</div>
          <p className="real-chats">Real chats from real customers.</p>
        </section>

        <section className="chef section-shell" id="chef">
          <div className="chef-image"><img src="/images/chef-zabb.jpg" alt="Chef Zabb in a white chef coat" loading="lazy" /></div>
          <div><p className="eyebrow">Meet Chef Zabb</p><h2>{copy.chefHeading}</h2><p className="chef-story">{copy.chefStory}</p><div className="mission-grid"><article><h3>Mission</h3><p>{copy.mission}</p></article><article><h3>Vision</h3><p>{copy.vision}</p></article></div></div>
        </section>

        <section className="certifications section-shell" id="certifications">
          <div className="cert-heading"><h2>{copy.certificationsHeading}</h2><p>{copy.certificationsText}</p><ul><li><ShieldCheck /> Registered with the Corporate Affairs Commission</li><li><Award /> Level 2 Award in Food Safety</li><li><Store /> Freshly prepared to order, never reheated stock</li></ul></div>
          <div className="cert-grid">
            <article><button className="cert-frame" onClick={() => setLightbox({ src:'/images/cac-certificate.jpg', alt:'CAC Certificate of Registration' })}><img src="/images/cac-certificate.jpg" alt="CAC Certificate of Registration" loading="lazy" /><span>Tap to enlarge</span></button><h3>CAC Business Name Registration</h3><p>Home Menu by Zab, BN 7228343. Registered 17 November 2023.</p></article>
            <article><button className="cert-frame" onClick={() => setLightbox({ src:'/images/food-safety-certificate.jpg', alt:'Level 2 Award in Food Safety certificate' })}><img src="/images/food-safety-certificate.jpg" alt="Level 2 Award in Food Safety certificate" loading="lazy" /><span>Tap to enlarge</span></button><h3>Level 2 Award in Food Safety</h3><p>UKQUALS Awarding Body, United Kingdom. Course provider: London Professional Training Centre. Awarded 1 December 2025.</p></article>
          </div>
        </section>
      </main>

      <Footer scrollTo={scrollTo} />
      {!menuOpen && !cartOpen && !customize && !lightbox && <a className="floating-whatsapp" aria-label="Chat with Chef Zabb on WhatsApp" href={whatsappUrl('Hello Chef Zabb, I would like to make an enquiry.')} target="_blank" rel="noreferrer"><Phone /></a>}
      {customize && <CustomizeModal state={customize} close={() => setCustomize(null)} save={addLine} />}
      {cartOpen && <CartDrawer cart={cart} setCart={setCart} close={() => setCartOpen(false)} checkout={checkout} setCheckout={setCheckout} thankYou={thankYou} setThankYou={setThankYou} openCustomize={openCustomize} />}
      {lightbox && <div className="lightbox" role="dialog" aria-modal="true" onClick={() => setLightbox(null)}><button aria-label="Close certificate" onClick={() => setLightbox(null)}><X /></button><img src={lightbox.src} alt={lightbox.alt} onClick={(event) => event.stopPropagation()} /></div>}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  )
}

function MenuDrawer({ close, scrollTo }) {
  const links = [
    ['Home','#top'],['Local Soups','#featured'],['Rice & Main Meals','#featured'],['Beans & Sides','#featured'],['Salads & Light Meals','#featured'],['Pastries & Bakes','#featured'],['Food Trays & Bulk Orders','#featured'],['How to Order','#how'],['Meet Chef Zabb','#chef'],['Certifications','#certifications'],['Reviews','#reviews'],['Contact','#footer'],
  ]
  return (
    <div className="menu-layer" role="dialog" aria-modal="true">
      <button className="menu-backdrop" aria-label="Close menu" onClick={close} />
      <aside className="menu-drawer">
        <div className="menu-top"><img src="/images/logo.png" alt="Home Menu by Zab" /><button aria-label="Close menu" onClick={close}><X /></button></div>
        <nav>{links.map(([label, target]) => <button key={label} onClick={() => scrollTo(target)}>{label}</button>)}</nav>
        <div className="menu-contact">
          <a className="btn btn-whatsapp" href={whatsappUrl('Hello Chef Zabb, I would like to make an enquiry.')} target="_blank" rel="noreferrer">Order on WhatsApp</a>
          <a href={`tel:${business.tel}`}>Phone: {business.whatsappDisplay}</a>
          <a href={business.instagramUrl} target="_blank" rel="noreferrer">Instagram {business.instagram}</a>
          <a href={business.tiktokUrl} target="_blank" rel="noreferrer">TikTok {business.tiktok}</a>
          <p>{business.address}</p><strong>24 hours pre-order notice</strong>
        </div>
      </aside>
    </div>
  )
}

function CustomizeModal({ state, close, save }) {
  const [selection, setSelection] = useState(state.selection)
  const [qty, setQty] = useState(state.qty)
  const [thumbError, setThumbError] = useState('')
  const product = state.product
  const price = lineTotal(product, selection, qty)

  const setChoice = (name, value) => setSelection((current) => ({ ...current, choices: { ...current.choices, [name]: value } }))
  const setAddon = (name, value, max) => setSelection((current) => ({ ...current, addons: { ...current.addons, [name]: Math.min(max, Math.max(0, value)) } }))

  const handleFile = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const thumb = await makeImageThumb(file)
      setSelection((current) => ({ ...current, inspiration: thumb }))
      setThumbError('')
    } catch (error) {
      setThumbError(error.message)
    }
  }

  return (
    <div className="modal-layer" role="dialog" aria-modal="true">
      <button className="modal-backdrop" aria-label="Close customize" onClick={close} />
      <div className="customize-modal">
        <div className="modal-head"><div><span>Customize</span><h2>{product.name}</h2></div><button aria-label="Close customize" onClick={close}><X /></button></div>
        <div className="modal-scroll">
          <div className="modal-product"><img src={product.image} alt={product.name} /><p>{product.description}</p></div>
          <section><h3>Size or variant</h3><div className="choice-grid">{product.sizes.map((size) => <button className={selection.size === size.name ? 'active' : ''} key={size.name} onClick={() => setSelection((current) => ({ ...current, size: size.name }))}><span>{size.name}</span><strong>{formatNaira(size.price)}</strong></button>)}</div></section>
          {product.choices.map((choice) => <section key={choice.name}><h3>{choice.name}</h3><div className="choice-grid">{choice.options.map((option) => <button className={selection.choices[choice.name] === option ? 'active' : ''} key={option} onClick={() => setChoice(choice.name, option)}>{option}</button>)}</div></section>)}
          {product.addons?.length > 0 && <section><h3>Add-ons</h3>{product.addons.map((addon) => <div className="addon-row" key={addon.name}><div><strong>{addon.name}</strong><span>{formatNaira(addon.price)} each</span></div><Quantity size="sm" value={selection.addons[addon.name] || 0} onChange={(value) => setAddon(addon.name, value, addon.max)} /></div>)}</section>}
          <section><h3>How would you like it customized?</h3><textarea maxLength="500" value={selection.note} onChange={(event) => setSelection((current) => ({ ...current, note: event.target.value }))} placeholder="Tell Chef Zabb how you want it: less pepper, no onions, extra sauce, special plating, allergies, etc." /></section>
          <section><h3>Upload an inspiration photo <span>(optional)</span></h3><label className="upload-box"><Upload /><span>Choose image</span><input type="file" accept="image/*" onChange={handleFile} /></label>{thumbError && <p className="field-error">{thumbError}</p>}{selection.inspiration && <div className="thumb-row"><img src={selection.inspiration.dataUrl} alt="Inspiration preview" /><span>{selection.inspiration.filename}</span><button type="button" aria-label="Remove inspiration photo" onClick={() => setSelection((current) => ({ ...current, inspiration: null }))}><X /></button></div>}</section>
          <section><h3>Quantity</h3><Quantity value={qty} onChange={setQty} /></section>
          <section className="breakdown"><h3>Price breakdown</h3><div><span>Size</span><strong>{formatNaira(product.sizes.find((item) => item.name === selection.size)?.price || product.sizes[0].price)}</strong></div>{product.addons?.map((addon) => Number(selection.addons[addon.name] || 0) > 0 && <div key={addon.name}><span>{addon.name} x{selection.addons[addon.name]}</span><strong>{formatNaira(addon.price * selection.addons[addon.name])}</strong></div>)}{price.discount > 0 && <div className="discount-row"><span>Bulk discount</span><strong>-{formatNaira(price.discount)}</strong></div>}<div className="total-row"><span>Line total</span><strong>{formatNaira(price.total)}</strong></div></section>
        </div>
        <div className="sticky-price"><div><span>Live total</span><strong>{formatNaira(price.total)}</strong></div><button className="btn btn-gold" onClick={() => save(product, selection, qty, state.line?.id)}>Add to Cart</button></div>
      </div>
    </div>
  )
}

function CartDrawer({ cart, setCart, close, checkout, setCheckout, thankYou, setThankYou, openCustomize }) {
  const [deliveryMethod, setDeliveryMethod] = useState('Pickup')
  const [area, setArea] = useState('Central Osogbo')
  const [form, setForm] = useState({ name:'', phone:'', address:'', date:'', time:'', notes:'' })
  const cartQty = cart.reduce((sum, line) => sum + line.qty, 0)
  const fee = deliveryMethod === 'Pickup' ? 0 : deliveryFees[area] || 0
  const totals = cartTotals(cart, fee)
  const setField = (name, value) => setForm((current) => ({ ...current, [name]: value }))
  const earliest = useMemo(() => {
    const date = new Date()
    date.setDate(date.getDate() + (cartQty >= 50 ? 2 : 1))
    return date.toISOString().split('T')[0]
  }, [cartQty])

  const removeLine = (id) => setCart((current) => current.filter((line) => line.id !== id))
  const changeQty = (id, qty) => setCart((current) => current.map((line) => line.id === id ? { ...line, qty: clampQty(qty) } : line))

  const placeOrder = () => {
    const methodLine = deliveryMethod === 'Pickup' ? 'Pickup - 63B Zone 4, Ayegbami Community, Ayekale Area' : `Delivery - ${area}`
    const orderLines = cart.map((line, index) => {
      const price = lineTotal(line.product, line.selection, line.qty)
      const choices = Object.entries(line.selection.choices || {}).map(([key, value]) => `${key}: ${value}`).join(', ')
      const addons = Object.entries(line.selection.addons || {}).filter(([, count]) => count > 0).map(([key, count]) => `${key} x${count}`).join(', ')
      const options = [choices, addons].filter(Boolean).join('; ')
      return `${index + 1}. ${line.product.name} x${line.qty} (${line.selection.size}) - ₦${price.total.toLocaleString('en-NG')}\n   Options: ${options || 'None'}\n   Customization: ${line.selection.note || 'None'}${line.selection.inspiration ? '\n   Inspiration photo: Yes, I will send it in this chat' : ''}`
    }).join('\n')
    const message = `Hello Chef Zabb! I would like to place an order.\n\n*Name:* ${form.name}\n*Phone:* ${form.phone}\n*Method:* ${methodLine}\n*Address:* ${deliveryMethod === 'Pickup' ? business.address : form.address}\n*Date and time:* ${form.date}, ${form.time}\n\n*ORDER*\n${orderLines}\n\n*Subtotal:* ${formatNaira(totals.subtotal)}\n*Delivery:* ${formatNaira(totals.delivery)}\n*Total:* ${formatNaira(totals.total)}\n\n*Notes:* ${form.notes || 'None'}\n\nThank you!`
    window.open(whatsappUrl(message), '_blank', 'noopener,noreferrer')
    setThankYou(true)
  }

  return (
    <div className="cart-layer" role="dialog" aria-modal="true">
      <button className="cart-backdrop" aria-label="Close cart" onClick={close} />
      <aside className="cart-drawer">
        <div className="cart-head"><div><h2>{thankYou ? 'Thank You' : checkout ? 'Checkout' : 'Your Cart'}</h2>{!thankYou && !checkout && <span>{cartQty} item{cartQty === 1 ? '' : 's'}</span>}</div><button aria-label="Close cart" onClick={close}><X /></button></div>
        {thankYou ? <div className="thank-you"><div className="thank-icon">✓</div><h3>Your order is ready on WhatsApp.</h3><p>If you added an inspiration photo, please attach it in the chat when you send the message.</p><button className="btn btn-primary" onClick={() => { setCart([]); setThankYou(false); setCheckout(false); close() }}>Start a new order</button></div>
          : checkout ? <div className="checkout"><button className="back-link" onClick={() => setCheckout(false)}>← Back to cart</button><label>Full name<input value={form.name} onChange={(event) => setField('name', event.target.value)} /></label><label>Phone number<input type="tel" value={form.phone} onChange={(event) => setField('phone', event.target.value)} /></label><fieldset><legend>Delivery method</legend><label><input type="radio" checked={deliveryMethod === 'Pickup'} onChange={() => setDeliveryMethod('Pickup')} /> Pickup</label><label><input type="radio" checked={deliveryMethod === 'Delivery'} onChange={() => setDeliveryMethod('Delivery')} /> Delivery</label></fieldset>{deliveryMethod === 'Delivery' && <><label>Delivery area<select value={area} onChange={(event) => setArea(event.target.value)}>{Object.keys(deliveryFees).filter((item) => item !== 'Pickup').map((item) => <option key={item}>{item}</option>)}</select></label><label>Delivery address<textarea value={form.address} onChange={(event) => setField('address', event.target.value)} /></label></>}<label>Delivery or pickup date<input type="date" min={earliest} value={form.date} onChange={(event) => setField('date', event.target.value)} /></label><label>Preferred time slot<select value={form.time} onChange={(event) => setField('time', event.target.value)}><option value="">Select a time</option><option>Morning 8am to 11am</option><option>Afternoon 12pm to 3pm</option><option>Evening 4pm to 7pm</option></select></label><label>Order notes<textarea value={form.notes} onChange={(event) => setField('notes', event.target.value)} /></label><p className="notice">Please order at least 24 hours ahead.</p><div className="checkout-total"><div><span>Subtotal</span><strong>{formatNaira(totals.subtotal)}</strong></div><div><span>Delivery</span><strong>{formatNaira(totals.delivery)}</strong></div><div className="grand"><span>Total</span><strong>{formatNaira(totals.total)}</strong></div></div><button className="btn btn-whatsapp place-order" disabled={!form.name || !form.phone || !form.date || !form.time || (deliveryMethod === 'Delivery' && !form.address)} onClick={placeOrder}>Place Order on WhatsApp</button></div>
          : <><div className="cart-lines">{cart.length === 0 ? <div className="empty-cart"><ShoppingCart /><h3>Your cart is empty</h3><p>Fresh meals are waiting for you.</p><button className="btn btn-primary" onClick={() => { close(); document.querySelector('#featured')?.scrollIntoView({ behavior:'smooth' }) }}>Browse the menu</button></div> : cart.map((line) => { const price = lineTotal(line.product, line.selection, line.qty); const summary = [line.selection.size, ...Object.entries(line.selection.choices || {}).map(([, value]) => value), ...Object.entries(line.selection.addons || {}).filter(([, count]) => count > 0).map(([name, count]) => `${name} x${count}`)].filter(Boolean).join(' • '); return <article className="cart-line" key={line.id}><img src={line.product.image} alt={line.product.name} /><div className="cart-line-main"><h3>{line.product.name}</h3><p>{summary}</p>{line.selection.note && <p className="custom-note">{line.selection.note.length > 70 ? `${line.selection.note.slice(0,70)}… show more` : line.selection.note}</p>}{line.selection.inspiration && <img className="cart-thumb" src={line.selection.inspiration.dataUrl} alt="Inspiration" />}<div className="cart-line-bottom"><Quantity size="sm" value={line.qty} onChange={(qty) => changeQty(line.id, qty)} /><strong>{formatNaira(price.total)}</strong></div>{price.discount > 0 && <p className="discount">Bulk saving: {formatNaira(price.discount)}</p>}<div className="line-actions"><button onClick={() => openCustomize(line.product, line)}>Edit</button><button onClick={() => removeLine(line.id)}>Remove</button></div></div></article> })}</div>{cart.length > 0 && <div className="cart-footer"><div><span>Subtotal</span><strong>{formatNaira(totals.subtotal)}</strong></div><p>Delivery fee is added at checkout</p><button className="btn btn-gold" onClick={() => setCheckout(true)}>Checkout</button></div>}</>}
      </aside>
    </div>
  )
}

function Footer({ scrollTo }) {
  const links = [['Home','#top'],['Local Soups','#featured'],['Rice & Main Meals','#featured'],['Beans & Sides','#featured'],['Salads & Light Meals','#featured'],['Pastries & Bakes','#featured'],['Food Trays & Bulk Orders','#featured'],['How to Order','#how'],['Meet Chef Zabb','#chef'],['Certifications','#certifications'],['Reviews','#reviews'],['Contact','#footer']]
  return (
    <footer id="footer">
      <div className="section-shell footer-grid"><div><img className="footer-logo" src="/images/logo.png" alt="Home Menu by Zab" /><p>{business.tagline}</p></div><div><h3>Quick links</h3>{links.map(([label,target]) => <button key={label} onClick={() => scrollTo(target)}>{label}</button>)}</div><div><h3>Contact</h3><p>WhatsApp and calls: {business.whatsappDisplay}</p><p>{business.address}</p><a href={business.instagramUrl} target="_blank" rel="noreferrer">Instagram {business.instagram}</a><a href={business.tiktokUrl} target="_blank" rel="noreferrer">TikTok {business.tiktok}</a><strong>Please order at least 24 hours ahead.</strong></div></div>
      <div className="copyright">© 2026 Home Menu by Zab. All rights reserved. CAC {business.cac}</div>
    </footer>
  )
}

export default App
