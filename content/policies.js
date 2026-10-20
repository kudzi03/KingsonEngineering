import { ANALYTICS } from './analytics.js';
export const POLICY_DATE = '2026-10-20';
export const POLICIES = [
  {
    slug:'privacy-policy', title:'Privacy policy',
    description:'How Kingson Engineering handles enquiry details, optional website analytics and privacy choices, and how to contact us about your information.',
    intro:'Clear information about what this website uses and what happens when you contact Kingson.',
    sections:[
      ['Who is responsible',[
        'Kingson Engineering is the trading name of Kingson Trading (Pvt) Ltd, based at No. 1262 Tynwald Industries, Harare, Zimbabwe. For privacy questions or requests, email <a href="mailto:admin1@kingsonengineering.co.zw">admin1@kingsonengineering.co.zw</a>.'
      ]],
      ['Enquiries and correspondence',[
        'You can browse our public pages without submitting an enquiry. If you use the enquiry form, we receive the organisation name, contact email address or telephone number, and the service and project details you enter. Optional details can include a job location and a description of your organisation. Business contact details and free-text descriptions can identify a person and are treated as personal information.',
        'We use this information to respond, prepare quotations, arrange work and keep related business records. Submitting the form saves the enquiry in Kingson’s enquiry system, hosted by Supabase. Authorised Kingson staff use it for this purpose. The website does not upload drawings; drawings you choose to email or send through WhatsApp are handled through those channels.',
        'Please provide only information needed for your enquiry. Do not send identity documents, payment-card information or sensitive personal details through this form. We do not use enquiry details for marketing or sell them.'
      ]],
      ['Website operation and service providers',[
        'Vercel hosts the website and Supabase hosts the enquiry system. These providers process technical information needed to deliver, secure and operate their services, which can include an IP address, request details and security logs. Some of this technical information can be personal data.',
        'Our enquiry database is hosted in Supabase’s EU West region. Hosting, analytics, email and messaging providers may process information outside Zimbabwe. Their processing is subject to their applicable terms and safeguards. Access to enquiry records is restricted; no internet service can promise absolute security.'
      ]],
      ['Optional Google Analytics',[
        (ANALYTICS.measurementId ? 'We use Google Analytics 4 only if you choose Allow analytics.' : 'Google Analytics is currently disabled. If activated, it will load only if you choose Allow analytics.')+' It measures page visits and broad contact actions to help us understand the website. We block the Google tag until permission is given; rejecting optional analytics keeps it blocked.',
        'Analytics may use cookie identifiers and process technical information such as browser/device information and approximate location derived from an IP address. We do not send enquiry text, names, organisation details, telephone numbers, email addresses, URL query strings or URL fragments to Analytics. We do not enable advertising personalisation, Google signals, user-provided data collection or session recordings.',
        'Use <button type="button" class="policy-inline-button" data-cookie-settings>Cookie settings</button> to change your choice. Withdrawing permission stops further Analytics collection from this browser and removes accessible Analytics cookies for this website. It does not automatically erase historical data already processed. See <a href="/cookie-policy">our cookie policy</a> and <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener">how Google uses information from sites that use its services</a>.'
      ]],
      ['Maps and external contact links',[
        'The Google map is not embedded until you choose Load Google map. Loading it connects your browser to Google and may use Google cookies or other storage under <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Google’s privacy policy</a>. The directions link also opens Google Maps. You can use the written workshop address instead.',
        'Call, email and WhatsApp links open the relevant application or external service only when selected. Those services process information under their own policies. Rejecting website analytics does not prevent you from contacting Kingson.'
      ]],
      ['Retention and your choices',[
        'We retain enquiry and correspondence information as needed to respond, manage the business relationship and meet applicable record-keeping or legal obligations. You may ask what we hold about you, request a correction or request deletion by contacting the email above. We may need enough information to verify your request, and some records may need to be retained where the law requires or permits it.',
        'Depending on applicable law, you may also have rights to object to processing, withdraw consent or complain to a data-protection authority. In Zimbabwe, the Postal and Telecommunications Regulatory Authority of Zimbabwe (POTRAZ) is the Data Protection Authority; information is available at <a href="https://www.potraz.gov.zw/" target="_blank" rel="noopener">potraz.gov.zw</a>. This notice may be updated when our practices change; the revision date is shown above.'
      ]]
    ]
  },
  {
    slug:'cookie-policy', title:'Cookie policy',
    description:'Understand Kingson Engineering’s necessary privacy-choice storage, optional Google Analytics cookies, Google Maps and how to change your preferences.',
    intro:'You can use this website and send an enquiry without accepting optional analytics.',
    sections:[
      ['Your choice',[
        'Optional analytics is off until you choose Allow analytics. Reject optional keeps Google Analytics blocked. Both choices leave services, project footage, quotation forms and contact links available. Change your choice at any time with <button type="button" class="policy-inline-button" data-cookie-settings>Cookie settings</button> in the footer or on this page.'
      ]],
      ['Necessary preference storage',[
        'We store your privacy choice in this browser’s local storage under kingson_privacy_v1 for up to 180 days, then ask again. This records your preference and its expiry, rather than a visitor or advertising identifier. If browser storage is blocked, the website still works, but it may ask again on your next page visit. This preference is kept whether you allow or reject optional analytics.'
      ]],
      ['Optional Analytics cookies',[
        (ANALYTICS.measurementId ? 'After permission, Google Analytics 4 can set' : 'If Analytics is activated and you allow it, Google Analytics 4 can set')+' first-party cookies such as _ga and _ga_<stream identifier> to distinguish browsers and sessions for usage reporting. We configure these cookies to expire after up to 90 days and do not enable advertising features. These cookie identifiers can be personal data even though they do not contain your name.',
        'The Google tag is not loaded when you reject optional analytics. Withdrawing consent stops collection and clears Analytics cookies accessible to this website. You can also delete cookies or local storage in your browser. Deleting the preference may cause the choice notice to appear again. Analytics can be blocked by browser privacy controls or extensions.'
      ]],
      ['Google Maps and other services',[
        'The map loads only when you explicitly request it. Google may then set or read its own cookies or storage under its policies. This is a separate choice from website analytics. Use the written address or the external directions link if you prefer. Email, WhatsApp and telephone applications have their own privacy settings; this website’s cookie choice does not control them.'
      ]],
      ['Contact',[
        'For questions, email <a href="mailto:admin1@kingsonengineering.co.zw">admin1@kingsonengineering.co.zw</a>. Read the <a href="/privacy-policy">privacy policy</a> for how enquiry information and service-provider processing are handled.'
      ]]
    ]
  },
  {
    slug:'terms-of-use', title:'Website terms of use',
    description:'Terms for using Kingson Engineering’s website, project imagery and enquiry tools, including how quotations and engineering advice are confirmed.',
    intro:'These terms explain use of the website. The scope and terms of any engineering work are agreed separately in writing.',
    sections:[
      ['The website and its information',[
        'This website is operated by Kingson Trading (Pvt) Ltd, trading as Kingson Engineering. It describes our services and supplied project work. Website information is general information, not a site-specific design, engineering assessment or instruction to carry out work.',
        'Specifications, feasibility, materials, site conditions, programme and price must be confirmed for your project. We aim to keep the information accurate and may correct or update it. Contact us if something appears incorrect.'
      ]],
      ['Enquiries and quotations',[
        'Sending an enquiry, opening a contact link or receiving an enquiry reference does not by itself confirm an order, quotation, booking, delivery date or contract. Any work is subject to a separately agreed written quotation or contract. The website does not take online payments.',
        'Provide accurate information and only drawings or other material that you are entitled to share. We may need additional measurements, drawings or a site visit before confirming a quotation.'
      ]],
      ['Project imagery and permitted use',[
        'Website text, branding, photographs and films are protected by applicable intellectual-property rights. You may view the site and share links to its public pages. Ask for permission before reproducing material commercially or presenting Kingson’s project imagery as your own work.',
        'Do not misuse the enquiry form, introduce harmful code, attempt unauthorised access to the staff system, or interfere with the website or its users.'
      ]],
      ['Availability and external services',[
        'We cannot guarantee uninterrupted website availability. External maps, telephone, email and messaging services are operated by their providers and have their own terms. If an online enquiry fails, you can contact Kingson directly.',
        'Nothing in these website terms excludes rights or responsibilities that applicable law does not allow to be excluded. They do not replace the agreed terms for a particular project.'
      ]],
      ['Privacy and contact',[
        'The <a href="/privacy-policy">privacy policy</a> explains how we handle enquiries and technical information. The <a href="/cookie-policy">cookie policy</a> explains optional analytics and your browser choices. For questions about the website or these terms, email <a href="mailto:admin1@kingsonengineering.co.zw">admin1@kingsonengineering.co.zw</a>.'
      ]]
    ]
  }
];
