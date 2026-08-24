/**
 * Long-form FAQ copy shared by the /faqs page and the shorter FAQ sections
 * on the homepage, product pages, and products listing page. Content is
 * business-confirmed (Aug 2026 audit): no formal return policy (sales
 * final), nationwide shipping with a flat Rs. 300 Lahore rate, JazzCash/
 * EasyPaisa as the non-COD payment option, and Grip-to-Grip plug-and-play
 * language pulled from the product catalog. Opening hours match the
 * placeholder used in the LocalBusiness schema (app/layout.tsx) pending
 * confirmation from the business owner.
 */

export interface FaqEntry {
  question: string;
  answer: string;
}

export interface FaqSection {
  title: string;
  faqs: FaqEntry[];
}

// --- Trust & the business ---

export const directImporterFaq: FaqEntry = {
  question:
    "Is Shahzaib Electronics a direct importer, or are you reselling through local distributors?",
  answer:
    "Shahzaib Electronics is a direct importer and wholesale distributor of car audio and multimedia electronics, based in Lahore, Pakistan. We import Android multimedia panels, amplifiers, subwoofers, speakers, dash cameras, and steering wheel control kits directly rather than buying through local middlemen, which is how we're able to keep prices below typical Lahore market retail. Our catalog includes both universal-fit accessories that work across many vehicle models and vehicle-specific units custom-fit to a particular make, model, and year range — for example, dedicated fascia kits for Toyota, Honda, and Suzuki dashboards. Every listing on our site states whether a product is universal or vehicle-specific, along with the exact compatible models, so you can check fitment before ordering. If you're ever unsure whether something fits your car, our team confirms compatibility over WhatsApp or phone before you place an order.",
};

export const shopLocationFaq: FaqEntry = {
  question: "Where is your shop located, and can I visit in person?",
  answer:
    "Yes — our store is located at Shop No. 3, Basher Centre, Montgomery Road, Lahore, and walk-in customers are welcome to browse our Android panels, amplifiers, speakers, subwoofers, and cameras in person before buying. Visiting in person is especially useful if you want to check screen quality, sound output, or build quality directly, or if you'd like our team to check fitment for your specific vehicle on the spot. We're open Monday–Saturday, 11:00 AM–9:00 PM.",
};

export const contactFaq: FaqEntry = {
  question: "How can I contact Shahzaib Electronics?",
  answer:
    "You can reach us by phone or WhatsApp at 0326 0454233, or by email at owner.shahzaib.autos@gmail.com. WhatsApp is generally the fastest way to confirm vehicle fitment, ask about stock availability, or get installation booked, since our team can review photos of your car's dashboard or send you real product photos and videos directly in the chat. Our shop is also open for walk-in visits at Basher Centre, Montgomery Road, Lahore, if you'd rather discuss your requirements in person.",
};

export const trustFaqs: FaqEntry[] = [directImporterFaq, shopLocationFaq, contactFaq];

// --- Shipping & payment ---

export const lahoreDeliveryFaq: FaqEntry = {
  question: "How much does delivery cost within Lahore?",
  answer:
    "Delivery within Lahore is a flat Rs. 300 per order, added at checkout alongside your product total. If you choose Cash on Delivery (COD), a separate 5% COD handling fee also applies on top of your order total, in addition to the flat delivery charge. To avoid the COD fee, you can pay via JazzCash or EasyPaisa at checkout instead. For order-specific delivery timing, our team can confirm an estimated delivery window over WhatsApp or phone once your order is placed.",
};

export const nationwideDeliveryFaq: FaqEntry = {
  question: "Do you deliver outside Lahore, to other cities in Pakistan?",
  answer:
    "Yes, we ship nationwide across Pakistan. Delivery within Lahore is a flat Rs. 300. For all other cities, delivery charges are added on top of the product price and vary by location — the exact delivery charge for your city is shown on the product page and at checkout, or you can confirm it with our team via WhatsApp or phone before ordering. Regardless of city, a 5% COD handling fee applies on top of the order total if you pay via Cash on Delivery; paying via JazzCash or EasyPaisa avoids that fee.",
};

export const returnPolicyFaq: FaqEntry = {
  question: "What's your return, exchange, or warranty policy?",
  answer:
    "We currently don't have a formal return or exchange policy, so please treat purchases as final once accepted. Since most orders are paid via Cash on Delivery, you have the chance to inspect your item at the doorstep before completing payment and accepting delivery — we'd recommend checking the product against your order before you pay the rider. If a product arrives with a genuine manufacturing fault, contact our team directly on WhatsApp or phone as soon as you notice it and we'll look into it.",
};

export const shippingFaqs: FaqEntry[] = [
  lahoreDeliveryFaq,
  nationwideDeliveryFaq,
  returnPolicyFaq,
];

// --- Installation & fitment ---

export const fitmentCheckFaq: FaqEntry = {
  question:
    "How do I know if a multimedia panel or accessory will fit my car?",
  answer:
    'Every product page on our site lists its fitment clearly: either "universal" (designed to fit a wide range of vehicles using a standard mounting kit) or a specific make, model, and year range — for example, "Toyota Sienta, 2015–2026." Vehicle-specific Android panels use a custom-molded fascia designed for that exact dashboard, so the fit is factory-clean rather than an adapted universal frame. Most of our multimedia units are "100% Grip-to-Grip plug-and-play," meaning they connect directly into your car\'s existing wiring harness without cutting or splicing any factory wires, and they retain functions like steering wheel controls, reverse camera input, and parking sensor integration where your car already supports them. If you\'re not sure which version matches your car, message us your car\'s make, model, and year before ordering and we\'ll confirm compatibility directly.',
};

export const gripToGripFaq: FaqEntry = {
  question: 'What does "Grip-to-Grip plug-and-play" actually mean?',
  answer:
    '"Grip-to-Grip plug-and-play" is the installation standard we use for our vehicle-specific Android multimedia panels. It means the replacement unit connects to your car\'s original wiring harness using the same connectors your factory radio used, with no cutting, splicing, or rewiring required. This keeps the installation reversible — if you ever wanted to revert to the factory stereo, the original wiring is untouched. It\'s different from a generic universal double-DIN install, which sometimes needs an adapter harness to restore steering wheel controls or camera inputs. Grip-to-Grip units are matched to a specific vehicle\'s dashboard shape and wiring layout, so functions like steering wheel audio controls, reverse camera feeds, and parking sensors typically continue working exactly as they did with the factory radio, with no extra wiring kits needed.',
};

export const universalVsVehicleSpecificFaq: FaqEntry = {
  question:
    'What\'s the difference between "universal" and "vehicle-specific" products in your catalog?',
  answer:
    'A "universal" product — like many of our amplifiers, subwoofers, speakers, and some Android panels — is designed to work across a wide range of vehicles using standard mounting sizes and generic wiring connections, so it\'s not tied to one car model. A "vehicle-specific" product, most commonly our multimedia panels, is built for one particular make, model, and year range using a custom-molded fascia that matches that car\'s dashboard exactly, plus a wiring harness pre-matched to that vehicle\'s factory connectors. Universal products give you more flexibility if you switch cars later. Vehicle-specific products give you a cleaner, factory-like fit and finish, but they\'re built for that one vehicle. We list the exact fitment on every product page so you always know which type you\'re looking at before buying.',
};

export const professionalInstallationFaq: FaqEntry = {
  question: "Do you offer professional installation, and how do I book it?",
  answer:
    "Yes. We offer professional, at-home installation for our multimedia systems, amplifiers, subwoofers, cameras, and other car accessories, so you don't need to find or vet your own installer. You can book an installation directly through our website, or contact our team to arrange a slot — our technician comes to you rather than requiring a shop visit. This is particularly useful for vehicle-specific Android panel installs, where correct wiring and dashboard fitting matter for keeping features like steering wheel controls and reverse camera integration working properly. If you'd rather install a product yourself, our team can also walk you through the process over phone or WhatsApp before you begin, since incorrect installation on some multimedia units can affect factory features.",
};

export const steeringWheelControlsFaq: FaqEntry = {
  question:
    "Do your Android multimedia panels support steering wheel controls and my reverse camera?",
  answer:
    "In most cases, yes. Because our vehicle-specific multimedia panels are matched to your exact car's factory wiring, they're designed to retain functions your car already has, including steering wheel audio controls, factory reverse camera input, and parking sensor integration, without needing extra adapter modules in most vehicles. Whether this is fully supported depends on your specific make, model, and year, since not every vehicle's factory setup is identical. We list steering wheel control and camera/parking sensor compatibility on each vehicle-specific product page, and our team can confirm exact compatibility for your car before you order. If you're currently using an aftermarket reverse camera rather than a factory one, let us know when you order so we can advise on the right wiring adapter.",
};

export const fitmentFaqs: FaqEntry[] = [
  fitmentCheckFaq,
  gripToGripFaq,
  universalVsVehicleSpecificFaq,
  professionalInstallationFaq,
  steeringWheelControlsFaq,
];

// --- Product education ---

export const ampVsSubwooferFaq: FaqEntry = {
  question: "What's the difference between a car amplifier and a subwoofer?",
  answer:
    'An amplifier and a subwoofer do different jobs in a car audio system. An amplifier takes the weak audio signal from your head unit or Android panel and boosts it into a much stronger signal capable of properly powering speakers or a subwoofer, since factory and aftermarket head units alone usually can\'t drive high-power speakers well on their own. A subwoofer is a specialized speaker built specifically to reproduce low-frequency bass that regular door or dashboard speakers can\'t handle cleanly. Most subwoofer setups need a dedicated amplifier channel to perform properly; some subwoofers are "powered," meaning they include a built-in amplifier in one enclosure, while others are "passive" and require a separate external amplifier. If you\'re building a full audio upgrade, you typically need both: an amplifier to power everything, and a subwoofer to add bass.',
};

export const wattageFaq: FaqEntry = {
  question:
    'How many watts do I need, and what does "Max Power" mean on your product listings?',
  answer:
    'Wattage on car audio equipment is usually listed two ways: RMS (continuous power the unit can handle reliably) and Peak/Max power (a short burst the unit can survive momentarily, not sustained output). A listing like "7000W Max" describes peak power, not what the amplifier continuously outputs — the real day-to-day output is closer to its RMS rating, which is typically a fraction of the peak figure. For most everyday car audio upgrades, matching your amplifier\'s RMS output to your speakers\' or subwoofer\'s RMS handling (not the peak number) gives the most reliable, distortion-free result. If you\'re unsure what RMS rating fits your specific speakers or subwoofer, tell our team what you\'re pairing it with and we\'ll recommend a matching amplifier or subwoofer before you buy.',
};

export const wirelessCarPlayFaq: FaqEntry = {
  question:
    "Do all your Android panels support wireless Apple CarPlay and Android Auto?",
  answer:
    "Most of our current-generation Android multimedia panels support both wireless Apple CarPlay and Android Auto, along with Google Maps, YouTube, and Bluetooth 5.0, but this varies by specific model and isn't guaranteed on every unit in our catalog, especially older listings. Wireless support means you can use CarPlay or Android Auto without plugging in a USB cable every time, which most customers prefer over wired-only units still common in the local market. Each product page lists exactly which connectivity features that specific unit supports, so check the individual listing rather than assuming. If wireless CarPlay/Android Auto is a must-have for you, mention it to our team before ordering and we'll point you to a confirmed-compatible model for your vehicle.",
};

export const productEducationFaqs: FaqEntry[] = [
  ampVsSubwooferFaq,
  wattageFaq,
  wirelessCarPlayFaq,
];

export const faqSections: FaqSection[] = [
  { title: "Trust & the business", faqs: trustFaqs },
  { title: "Shipping & payment", faqs: shippingFaqs },
  { title: "Installation & fitment", faqs: fitmentFaqs },
  { title: "Product education", faqs: productEducationFaqs },
];
