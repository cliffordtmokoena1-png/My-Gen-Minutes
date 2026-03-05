type FeatureBlock = {
  title: string;
  description: string;
  imageUrl: string;
};

export type ClerkDirectPageData = {
  slug: string;
  seo: {
    title: string;
    description: string;
  };
  hero: {
    label: string;
    title: string;
    description: string;
    imageUrl?: string;
  };
  features: FeatureBlock[];
};

export const clerkDirectPages: ClerkDirectPageData[] = [
  {
    slug: "product",
    seo: {
      title: "All Features | ClerkDirect",
      description:
        "Explore the full suite of ClerkDirect features: agenda management, AI minutes generation, transcription, votes and motions, public portal, and more.",
    },
    hero: {
      label: "Product",
      title: "Everything You Need to Run Better Meetings",
      description:
        "From agenda creation to published minutes, ClerkDirect automates every step of your meeting workflow so your team can focus on decisions, not paperwork.",
      imageUrl: "https://picsum.photos/600/400?random=product-hero",
    },
    features: [
      {
        title: "AI-Powered Minutes Generation",
        description:
          "Upload a recording and let ClerkDirect produce structured, professional meeting minutes in seconds. Our AI identifies speakers, extracts action items, and formats everything to your organization's standards.",
        imageUrl: "https://picsum.photos/600/400?random=product-minutes",
      },
      {
        title: "Agenda Builder with Templates",
        description:
          "Create agendas from templates, reorder items with drag-and-drop, and distribute them digitally to all stakeholders before the meeting even starts.",
        imageUrl: "https://picsum.photos/600/400?random=product-agenda",
      },
      {
        title: "Real-Time Transcription in 96+ Languages",
        description:
          "Capture every word with speaker-labeled transcription that works across languages. Searchable, timestamped, and ready for the public record.",
        imageUrl: "https://picsum.photos/600/400?random=product-transcription",
      },
      {
        title: "Votes, Motions, and Resolutions",
        description:
          "Record roll-call votes, track motions through their lifecycle, and archive resolutions with full audit trails for compliance.",
        imageUrl: "https://picsum.photos/600/400?random=product-votes",
      },
    ],
  },
  {
    slug: "product/agenda-management",
    seo: {
      title: "Agenda Management | ClerkDirect",
      description:
        "Create, organize, and distribute meeting agendas digitally. Drag-and-drop builder, templates, and stakeholder notifications built in.",
    },
    hero: {
      label: "Product",
      title: "Agenda Management That Keeps Everyone Prepared",
      description:
        "Build agendas in minutes, not hours. Use templates, drag-and-drop reordering, and automatic stakeholder notifications to ensure every meeting starts on the same page.",
      imageUrl: "https://picsum.photos/600/400?random=agenda-hero",
    },
    features: [
      {
        title: "Template Library",
        description:
          "Start from pre-built agenda templates for council meetings, board sessions, committee reviews, and more. Customize once, reuse forever.",
        imageUrl: "https://picsum.photos/600/400?random=agenda-templates",
      },
      {
        title: "Drag-and-Drop Builder",
        description:
          "Reorder agenda items, nest sub-topics, and set time allocations with an intuitive visual editor that anyone on your team can use.",
        imageUrl: "https://picsum.photos/600/400?random=agenda-builder",
      },
      {
        title: "Automatic Distribution",
        description:
          "Notify board members, department heads, and the public when agendas are published. Integrated email and portal notifications keep everyone informed.",
        imageUrl: "https://picsum.photos/600/400?random=agenda-distribute",
      },
    ],
  },
  {
    slug: "product/minutes-generation",
    seo: {
      title: "AI Minutes Generation | ClerkDirect",
      description:
        "Transform meeting recordings into structured, professional minutes with AI. Speaker labels, action items, and compliance-ready formatting.",
    },
    hero: {
      label: "Product",
      title: "Meeting Minutes in Seconds, Not Hours",
      description:
        "Upload a recording and ClerkDirect produces formatted minutes with speaker attribution, action items, and key decisions. Review, edit, and publish from one place.",
      imageUrl: "https://picsum.photos/600/400?random=minutes-hero",
    },
    features: [
      {
        title: "AI-Powered Drafting",
        description:
          "Our AI listens to your recordings and produces a structured draft with headers, speaker labels, timestamps, and extracted motions ready for your review.",
        imageUrl: "https://picsum.photos/600/400?random=minutes-ai",
      },
      {
        title: "Action Item Extraction",
        description:
          "ClerkDirect automatically identifies action items, assigns them to speakers, and tracks completion status so nothing falls through the cracks.",
        imageUrl: "https://picsum.photos/600/400?random=minutes-actions",
      },
      {
        title: "One-Click Publishing",
        description:
          "Export minutes as Word, PDF, or publish directly to your public portal. Formatting follows your organization's standards every time.",
        imageUrl: "https://picsum.photos/600/400?random=minutes-publish",
      },
    ],
  },
  {
    slug: "product/transcription",
    seo: {
      title: "Meeting Transcription | ClerkDirect",
      description:
        "Real-time speech-to-text with speaker labels in 96+ languages. Searchable, timestamped transcripts for every meeting.",
    },
    hero: {
      label: "Product",
      title: "Accurate Transcription for Every Meeting",
      description:
        "Capture every word with speaker-labeled transcription that works in 96+ languages. Fully searchable, timestamped, and ready for the official record.",
      imageUrl: "https://picsum.photos/600/400?random=transcription-hero",
    },
    features: [
      {
        title: "96+ Language Support",
        description:
          "Transcribe meetings in English, Spanish, Mandarin, and dozens more. Multilingual meetings are handled seamlessly with automatic language detection.",
        imageUrl: "https://picsum.photos/600/400?random=transcription-languages",
      },
      {
        title: "Speaker Identification",
        description:
          "ClerkDirect labels who said what, making it easy to attribute statements, track discussion threads, and produce accurate meeting records.",
        imageUrl: "https://picsum.photos/600/400?random=transcription-speakers",
      },
      {
        title: "Searchable Archives",
        description:
          "Full-text search across all your transcripts. Find any statement, decision, or discussion point from any meeting in seconds.",
        imageUrl: "https://picsum.photos/600/400?random=transcription-search",
      },
    ],
  },
  {
    slug: "product/votes-and-motions",
    seo: {
      title: "Votes & Motions | ClerkDirect",
      description:
        "Record, track, and archive motions, roll-call votes, and resolutions with full audit trails for open meeting compliance.",
    },
    hero: {
      label: "Product",
      title: "Track Every Vote and Motion with Confidence",
      description:
        "From motion introduction to final resolution, ClerkDirect gives you a complete, auditable record of every vote your organization takes.",
      imageUrl: "https://picsum.photos/600/400?random=votes-hero",
    },
    features: [
      {
        title: "Roll-Call Voting",
        description:
          "Record individual member votes with timestamps. Support for voice votes, roll-call votes, and unanimous consent with automatic tally.",
        imageUrl: "https://picsum.photos/600/400?random=votes-rollcall",
      },
      {
        title: "Motion Lifecycle Tracking",
        description:
          "Track motions from introduction through second, discussion, amendment, and final vote. Every state change is logged for the record.",
        imageUrl: "https://picsum.photos/600/400?random=votes-lifecycle",
      },
      {
        title: "Resolution Archive",
        description:
          "Maintain a searchable archive of all adopted resolutions with links to the meetings, votes, and discussions that produced them.",
        imageUrl: "https://picsum.photos/600/400?random=votes-archive",
      },
    ],
  },
  {
    slug: "product/organization-management",
    seo: {
      title: "Organization Management | ClerkDirect",
      description:
        "Manage boards, committees, departments, and member roles from one central hub. Role-based access and org-wide visibility.",
    },
    hero: {
      label: "Product",
      title: "One Hub for Your Entire Organization",
      description:
        "Manage boards, committees, departments, and member roles centrally. ClerkDirect gives every team the structure they need without the overhead.",
      imageUrl: "https://picsum.photos/600/400?random=org-hero",
    },
    features: [
      {
        title: "Board and Committee Structure",
        description:
          "Define your organizational hierarchy with boards, sub-committees, and working groups. Each has its own meetings, agendas, and member lists.",
        imageUrl: "https://picsum.photos/600/400?random=org-boards",
      },
      {
        title: "Role-Based Access",
        description:
          "Control who can create agendas, approve minutes, publish to the portal, and manage members with granular role-based permissions.",
        imageUrl: "https://picsum.photos/600/400?random=org-roles",
      },
      {
        title: "Member Directory",
        description:
          "Maintain a central directory of all members across boards and committees with contact details, term dates, and attendance records.",
        imageUrl: "https://picsum.photos/600/400?random=org-directory",
      },
    ],
  },
  {
    slug: "product/public-portal",
    seo: {
      title: "Public Portal | ClerkDirect",
      description:
        "Publish meeting records, agendas, minutes, and recordings for public transparency. Embeddable portal for your website.",
    },
    hero: {
      label: "Product",
      title: "Transparent Meetings, Open to the Public",
      description:
        "Publish agendas, minutes, recordings, and resolutions to a public-facing portal that meets open meeting requirements and builds community trust.",
      imageUrl: "https://picsum.photos/600/400?random=portal-hero",
    },
    features: [
      {
        title: "Automated Publishing",
        description:
          "Approved minutes and agendas are published to your portal automatically. No manual uploads, no forgotten updates.",
        imageUrl: "https://picsum.photos/600/400?random=portal-auto",
      },
      {
        title: "Searchable Public Records",
        description:
          "Citizens can search agendas, minutes, and recordings by date, topic, or keyword. Full transparency without the filing cabinet.",
        imageUrl: "https://picsum.photos/600/400?random=portal-search",
      },
      {
        title: "Embeddable Widget",
        description:
          "Embed your meeting calendar and records directly into your existing government or organization website. No separate portal needed.",
        imageUrl: "https://picsum.photos/600/400?random=portal-embed",
      },
    ],
  },
  {
    slug: "product/security",
    seo: {
      title: "Security & Compliance | ClerkDirect",
      description:
        "SOC 2 Type II compliant meeting management with encryption, role-based access, and audit trails built for government requirements.",
    },
    hero: {
      label: "Product",
      title: "Enterprise Security Built for Government",
      description:
        "SOC 2 Type II certified with end-to-end encryption, role-based access controls, and complete audit trails. Built to meet the security requirements government organizations demand.",
      imageUrl: "https://picsum.photos/600/400?random=security-hero",
    },
    features: [
      {
        title: "SOC 2 Type II Certified",
        description:
          "ClerkDirect has completed SOC 2 Type II audit certification, demonstrating ongoing commitment to data security, availability, and confidentiality.",
        imageUrl: "https://picsum.photos/600/400?random=security-soc2",
      },
      {
        title: "End-to-End Encryption",
        description:
          "All data is encrypted in transit and at rest. Meeting recordings, transcripts, and documents are protected with AES-256 encryption.",
        imageUrl: "https://picsum.photos/600/400?random=security-encryption",
      },
      {
        title: "Audit Trails",
        description:
          "Every action in ClerkDirect is logged with timestamps and user attribution. Know who accessed, edited, or published any document at any time.",
        imageUrl: "https://picsum.photos/600/400?random=security-audit",
      },
    ],
  },
  {
    slug: "product/ai-artifacts",
    seo: {
      title: "AI-Powered Artifacts | ClerkDirect",
      description:
        "Automatically extract action items, summaries, key decisions, and follow-ups from your meetings with AI.",
    },
    hero: {
      label: "Product",
      title: "AI That Extracts What Matters",
      description:
        "ClerkDirect AI goes beyond transcription. It identifies action items, summarizes discussions, highlights key decisions, and generates follow-up tasks automatically.",
      imageUrl: "https://picsum.photos/600/400?random=ai-hero",
    },
    features: [
      {
        title: "Smart Summaries",
        description:
          "Get concise meeting summaries that capture the essential decisions, discussions, and outcomes without reading the full transcript.",
        imageUrl: "https://picsum.photos/600/400?random=ai-summaries",
      },
      {
        title: "Action Item Detection",
        description:
          "AI automatically identifies commitments, deadlines, and assignments from meeting conversations and turns them into trackable tasks.",
        imageUrl: "https://picsum.photos/600/400?random=ai-actions",
      },
      {
        title: "Decision Highlighting",
        description:
          "Key decisions are automatically flagged and linked to the discussion context, making it easy to reference why a decision was made.",
        imageUrl: "https://picsum.photos/600/400?random=ai-decisions",
      },
    ],
  },
  {
    slug: "solutions/government",
    seo: {
      title: "Government Meeting Management | ClerkDirect",
      description:
        "Meeting management software built for city councils, county boards, and municipal agencies. Automate agendas, minutes, and public records.",
    },
    hero: {
      label: "Solutions",
      title: "Meeting Management Built for Government",
      description:
        "City councils, county boards, and municipal agencies trust ClerkDirect to automate agendas, minutes, and public records while meeting open meeting compliance requirements.",
      imageUrl: "https://picsum.photos/600/400?random=gov-hero",
    },
    features: [
      {
        title: "Open Meeting Compliance",
        description:
          "Automatically publish agendas and minutes within required timeframes. ClerkDirect tracks deadlines and ensures your records meet state and local transparency laws.",
        imageUrl: "https://picsum.photos/600/400?random=gov-compliance",
      },
      {
        title: "Council Meeting Workflows",
        description:
          "Purpose-built workflows for council meetings: consent calendars, public hearings, ordinance readings, and roll-call votes are all supported out of the box.",
        imageUrl: "https://picsum.photos/600/400?random=gov-workflows",
      },
      {
        title: "Citizen Access Portal",
        description:
          "Give constituents a searchable, public-facing portal to find agendas, minutes, recordings, and resolutions from any meeting in your history.",
        imageUrl: "https://picsum.photos/600/400?random=gov-portal",
      },
    ],
  },
  {
    slug: "solutions/school-boards",
    seo: {
      title: "School Board Meeting Software | ClerkDirect",
      description:
        "Meeting management for K-12 school districts, higher education boards, and academic committees. Streamline board governance with AI.",
    },
    hero: {
      label: "Solutions",
      title: "Streamline School Board Governance",
      description:
        "From K-12 districts to higher education, ClerkDirect helps school boards run efficient meetings, maintain accurate records, and keep families informed.",
      imageUrl: "https://picsum.photos/600/400?random=school-hero",
    },
    features: [
      {
        title: "Board Meeting Packages",
        description:
          "Assemble complete board meeting packages with agendas, supporting documents, and background materials. Distribute digitally to all board members.",
        imageUrl: "https://picsum.photos/600/400?random=school-packages",
      },
      {
        title: "Executive Session Support",
        description:
          "Manage closed session agendas, separate minutes, and confidential materials with the access controls school boards require.",
        imageUrl: "https://picsum.photos/600/400?random=school-executive",
      },
      {
        title: "Parent and Community Access",
        description:
          "Publish meeting records to a family-friendly portal. Parents and community members can follow board decisions that affect their schools.",
        imageUrl: "https://picsum.photos/600/400?random=school-community",
      },
    ],
  },
  {
    slug: "solutions/special-districts",
    seo: {
      title: "Special District Meeting Software | ClerkDirect",
      description:
        "Meeting management for water, fire, transit, and utility districts. Comply with public meeting requirements and automate record-keeping.",
    },
    hero: {
      label: "Solutions",
      title: "Meeting Management for Special Districts",
      description:
        "Water districts, fire districts, transit authorities, and utility boards have unique meeting requirements. ClerkDirect handles them all.",
      imageUrl: "https://picsum.photos/600/400?random=special-hero",
    },
    features: [
      {
        title: "Multi-Board Support",
        description:
          "Manage multiple boards and committees within a single district. Each has its own meeting schedule, agendas, and member roster.",
        imageUrl: "https://picsum.photos/600/400?random=special-multiboard",
      },
      {
        title: "Public Hearing Management",
        description:
          "Track public hearing notices, capture public comments, and ensure all required documentation is recorded and published on time.",
        imageUrl: "https://picsum.photos/600/400?random=special-hearing",
      },
      {
        title: "Small Staff, Big Capability",
        description:
          "Special districts often run lean. ClerkDirect automates the record-keeping that would otherwise require a dedicated clerk.",
        imageUrl: "https://picsum.photos/600/400?random=special-lean",
      },
    ],
  },
  {
    slug: "solutions/nonprofits",
    seo: {
      title: "Nonprofit Board Meeting Software | ClerkDirect",
      description:
        "Board governance and volunteer committee management for nonprofits. Keep your organization transparent and well-documented.",
    },
    hero: {
      label: "Solutions",
      title: "Board Governance for Nonprofits",
      description:
        "Nonprofits deserve the same meeting tools as government agencies. ClerkDirect helps your board stay organized, transparent, and audit-ready.",
      imageUrl: "https://picsum.photos/600/400?random=nonprofit-hero",
    },
    features: [
      {
        title: "Board Meeting Management",
        description:
          "Run board meetings with structured agendas, recorded votes, and published minutes. Keep your board governance up to grant compliance standards.",
        imageUrl: "https://picsum.photos/600/400?random=nonprofit-board",
      },
      {
        title: "Committee Coordination",
        description:
          "Finance committees, program committees, and volunteer groups each get their own meeting space with agendas, minutes, and member management.",
        imageUrl: "https://picsum.photos/600/400?random=nonprofit-committees",
      },
      {
        title: "Audit-Ready Records",
        description:
          "Maintain complete meeting records that satisfy auditors, funders, and regulatory bodies. Every document is timestamped and version-controlled.",
        imageUrl: "https://picsum.photos/600/400?random=nonprofit-audit",
      },
    ],
  },
  {
    slug: "solutions/committees",
    seo: {
      title: "Committee Meeting Software | ClerkDirect",
      description:
        "Meeting management for standing committees, advisory boards, and working groups. Structure and automate committee workflows.",
    },
    hero: {
      label: "Solutions",
      title: "Run Better Committee Meetings",
      description:
        "Standing committees, advisory boards, and working groups need structure without overhead. ClerkDirect gives committees the tools to be productive and accountable.",
      imageUrl: "https://picsum.photos/600/400?random=committee-hero",
    },
    features: [
      {
        title: "Committee Workspaces",
        description:
          "Each committee gets its own workspace with meeting history, document library, member roster, and upcoming agenda drafts.",
        imageUrl: "https://picsum.photos/600/400?random=committee-workspace",
      },
      {
        title: "Recommendations and Reports",
        description:
          "Committees produce recommendations for the full board. ClerkDirect tracks recommendations from draft through board action.",
        imageUrl: "https://picsum.photos/600/400?random=committee-reports",
      },
      {
        title: "Cross-Committee Visibility",
        description:
          "See what every committee is working on from a single dashboard. Prevent duplicated efforts and keep the full board informed.",
        imageUrl: "https://picsum.photos/600/400?random=committee-visibility",
      },
    ],
  },
  {
    slug: "about",
    seo: {
      title: "About ClerkDirect | AI Meeting Management",
      description:
        "ClerkDirect is built by the GovClerkMinutes team. Learn about our mission to modernize how organizations run meetings.",
    },
    hero: {
      label: "Company",
      title: "Modernizing How Organizations Run Meetings",
      description:
        "ClerkDirect is built by the GovClerkMinutes team with a single mission: eliminate the hours of manual work that go into every meeting, so organizations can focus on the decisions that matter.",
    },
    features: [
      {
        title: "Our Mission",
        description:
          "Government bodies, school boards, and nonprofits spend thousands of hours each year on meeting paperwork. We believe that time belongs to the communities they serve.",
        imageUrl: "https://picsum.photos/600/400?random=about-mission",
      },
      {
        title: "Built by GovClerkMinutes",
        description:
          "ClerkDirect is powered by the same AI transcription and minutes generation technology trusted by thousands of organizations through GovClerkMinutes.",
        imageUrl: "https://picsum.photos/600/400?random=about-mg",
      },
    ],
  },
  {
    slug: "contact",
    seo: {
      title: "Contact ClerkDirect | Get in Touch",
      description:
        "Have questions about ClerkDirect? Contact our sales and support teams for demos, pricing, and technical assistance.",
    },
    hero: {
      label: "Company",
      title: "Get in Touch with Our Team",
      description:
        "Whether you need a demo, have a question about pricing, or want technical support, our team is here to help. Reach out and we will get back to you within one business day.",
    },
    features: [
      {
        title: "Sales Inquiries",
        description:
          "Interested in ClerkDirect for your organization? Our sales team can walk you through features, pricing, and implementation. Email us at sales@clerkdirect.com.",
        imageUrl: "https://picsum.photos/600/400?random=contact-sales",
      },
      {
        title: "Technical Support",
        description:
          "Already a customer? Our support team is available to help with setup, integrations, and any technical questions. Email support@clerkdirect.com.",
        imageUrl: "https://picsum.photos/600/400?random=contact-support",
      },
    ],
  },
  {
    slug: "careers",
    seo: {
      title: "Careers at ClerkDirect | Join Our Team",
      description:
        "Join the team building AI-powered meeting management for government and organizations. See open positions at ClerkDirect.",
    },
    hero: {
      label: "Company",
      title: "Build the Future of Meeting Management",
      description:
        "We are building tools that save thousands of hours for government bodies, school boards, and nonprofits. If that sounds like meaningful work, we want to hear from you.",
    },
    features: [
      {
        title: "Why ClerkDirect",
        description:
          "We are a small, focused team solving a real problem for real organizations. Every feature you build has a direct impact on how communities are governed.",
        imageUrl: "https://picsum.photos/600/400?random=careers-why",
      },
      {
        title: "Open Positions",
        description:
          "We are always looking for talented engineers, designers, and go-to-market professionals. Check back for open roles or send your resume to careers@clerkdirect.com.",
        imageUrl: "https://picsum.photos/600/400?random=careers-positions",
      },
    ],
  },
  {
    slug: "partners",
    seo: {
      title: "Partner with ClerkDirect | Integration Partners",
      description:
        "Become a ClerkDirect partner. Integration partnerships, reseller programs, and technology alliances for meeting management.",
    },
    hero: {
      label: "Company",
      title: "Partner with ClerkDirect",
      description:
        "We work with technology partners, consultants, and resellers who serve government and public-sector organizations. Let us build something together.",
    },
    features: [
      {
        title: "Technology Partnerships",
        description:
          "Integrate your platform with ClerkDirect to offer meeting management as part of your solution. APIs and webhooks make integration straightforward.",
        imageUrl: "https://picsum.photos/600/400?random=partners-tech",
      },
      {
        title: "Reseller Program",
        description:
          "Serve government clients? Add ClerkDirect to your portfolio. We provide training, co-marketing, and dedicated partner support.",
        imageUrl: "https://picsum.photos/600/400?random=partners-reseller",
      },
    ],
  },
  {
    slug: "overview",
    seo: {
      title: "Platform Overview | ClerkDirect",
      description:
        "See how ClerkDirect connects agenda management, transcription, AI minutes, votes, and public records into one seamless meeting workflow.",
    },
    hero: {
      label: "Resources",
      title: "One Platform, Every Step of Your Meeting",
      description:
        "ClerkDirect brings together agenda building, live transcription, AI-powered minutes, vote tracking, and public records publishing so your team can move from preparation to compliance in a single workflow.",
      imageUrl: "https://picsum.photos/600/400?random=overview-hero",
    },
    features: [
      {
        title: "End-to-End Meeting Lifecycle",
        description:
          "Most teams juggle separate tools for agendas, notes, recordings, and publishing. ClerkDirect replaces that patchwork with a connected pipeline where each step feeds into the next automatically.",
        imageUrl: "https://picsum.photos/600/400?random=overview-lifecycle",
      },
      {
        title: "Works with Your Existing Stack",
        description:
          "ClerkDirect integrates with calendar systems, video conferencing platforms, and document storage providers your organization already uses, so adoption is fast and friction-free.",
        imageUrl: "https://picsum.photos/600/400?random=overview-integrations",
      },
      {
        title: "Built for Teams of Every Size",
        description:
          "Whether you manage a single board or coordinate dozens of committees, ClerkDirect scales to match your organizational structure without additional complexity.",
        imageUrl: "https://picsum.photos/600/400?random=overview-scale",
      },
    ],
  },
  {
    slug: "blog",
    seo: {
      title: "Blog | ClerkDirect",
      description:
        "Insights on meeting management, public transparency, AI in government, and best practices for clerks and board administrators.",
    },
    hero: {
      label: "Resources",
      title: "Insights for Modern Meeting Management",
      description:
        "Practical advice, product updates, and industry perspectives for clerks, board administrators, and anyone responsible for keeping meetings organized and transparent.",
    },
    features: [
      {
        title: "Product Updates",
        description:
          "Stay current with the latest ClerkDirect features, improvements, and integrations. We publish detailed release notes so you always know what is new.",
        imageUrl: "https://picsum.photos/600/400?random=blog-updates",
      },
      {
        title: "Best Practices",
        description:
          "Learn how leading organizations streamline their meeting workflows, improve public engagement, and reduce the administrative burden on their staff.",
        imageUrl: "https://picsum.photos/600/400?random=blog-practices",
      },
      {
        title: "Industry Perspectives",
        description:
          "Explore how AI, digital transparency, and evolving regulations are reshaping the way government bodies and nonprofits conduct their meetings.",
        imageUrl: "https://picsum.photos/600/400?random=blog-perspectives",
      },
    ],
  },
  {
    slug: "docs",
    seo: {
      title: "Documentation | ClerkDirect",
      description:
        "Technical documentation, API reference, setup guides, and integration instructions for ClerkDirect meeting management software.",
    },
    hero: {
      label: "Resources",
      title: "Documentation and Developer Guides",
      description:
        "Everything you need to set up, configure, and integrate ClerkDirect. From getting started guides to API reference, our documentation helps your team move quickly.",
    },
    features: [
      {
        title: "Getting Started",
        description:
          "Step-by-step guides walk you through account setup, organization configuration, and your first meeting. Most teams are up and running within a single afternoon.",
        imageUrl: "https://picsum.photos/600/400?random=docs-start",
      },
      {
        title: "API Reference",
        description:
          "Integrate ClerkDirect into your existing systems with our REST API. Full endpoint documentation, authentication guides, and code examples are included.",
        imageUrl: "https://picsum.photos/600/400?random=docs-api",
      },
      {
        title: "Integration Guides",
        description:
          "Connect ClerkDirect with calendar providers, video conferencing tools, and document storage systems. Each guide includes prerequisites, setup steps, and troubleshooting tips.",
        imageUrl: "https://picsum.photos/600/400?random=docs-integrations",
      },
    ],
  },
  {
    slug: "help",
    seo: {
      title: "Help Center | ClerkDirect",
      description:
        "Find answers to common questions, troubleshooting guides, and support contact information for ClerkDirect meeting management software.",
    },
    hero: {
      label: "Resources",
      title: "How Can We Help?",
      description:
        "Browse frequently asked questions, troubleshooting guides, and step-by-step tutorials. If you need more assistance, our support team is one message away.",
    },
    features: [
      {
        title: "Frequently Asked Questions",
        description:
          "Answers to the most common questions about account setup, billing, meeting workflows, and feature configuration, all organized by topic for quick access.",
        imageUrl: "https://picsum.photos/600/400?random=help-faq",
      },
      {
        title: "Troubleshooting Guides",
        description:
          "Step-by-step instructions for resolving common issues with recordings, transcription accuracy, portal publishing, and user permissions.",
        imageUrl: "https://picsum.photos/600/400?random=help-troubleshoot",
      },
      {
        title: "Contact Support",
        description:
          "Need hands-on help? Reach our support team by email at support@clerkdirect.com. We respond to all inquiries within one business day.",
        imageUrl: "https://picsum.photos/600/400?random=help-contact",
      },
    ],
  },
  {
    slug: "case-studies",
    seo: {
      title: "Case Studies | ClerkDirect",
      description:
        "See how government agencies, school boards, and nonprofits use ClerkDirect to save time, improve transparency, and modernize their meeting workflows.",
    },
    hero: {
      label: "Resources",
      title: "Real Results from Real Organizations",
      description:
        "Discover how cities, school districts, and nonprofits have transformed their meeting workflows with ClerkDirect. Each case study details the challenges, implementation process, and measurable outcomes.",
    },
    features: [
      {
        title: "Government Success Stories",
        description:
          "Learn how municipal clerks have reduced minutes preparation time by up to 80% while improving the accuracy and consistency of their public records.",
        imageUrl: "https://picsum.photos/600/400?random=cases-government",
      },
      {
        title: "Education Outcomes",
        description:
          "School districts share how ClerkDirect streamlined board meeting workflows, increased community access to meeting records, and freed staff time for student-focused work.",
        imageUrl: "https://picsum.photos/600/400?random=cases-education",
      },
      {
        title: "Nonprofit Impact",
        description:
          "Nonprofit boards describe how structured meeting management improved governance practices, satisfied auditors, and strengthened trust with donors and stakeholders.",
        imageUrl: "https://picsum.photos/600/400?random=cases-nonprofit",
      },
    ],
  },
  {
    slug: "acceptable-use",
    seo: {
      title: "Acceptable Use Policy | ClerkDirect",
      description:
        "ClerkDirect acceptable use policy. Guidelines for responsible use of our meeting management platform and services.",
    },
    hero: {
      label: "Legal",
      title: "Acceptable Use Policy",
      description:
        "This policy outlines the rules and guidelines for using ClerkDirect services. By using our platform, you agree to comply with these terms to ensure a safe and productive experience for all users.",
    },
    features: [
      {
        title: "Permitted Use",
        description:
          "ClerkDirect is designed for legitimate meeting management activities including agenda creation, meeting recording, transcription, minutes generation, and public records publishing.",
        imageUrl: "https://picsum.photos/600/400?random=aup-permitted",
      },
      {
        title: "Prohibited Activities",
        description:
          "Users may not use ClerkDirect for unauthorized surveillance, distribution of harmful content, circumvention of security controls, or any activity that violates applicable law.",
        imageUrl: "https://picsum.photos/600/400?random=aup-prohibited",
      },
      {
        title: "Enforcement",
        description:
          "ClerkDirect reserves the right to suspend or terminate accounts that violate this policy. If you believe a violation has occurred, please report it to compliance@clerkdirect.com.",
        imageUrl: "https://picsum.photos/600/400?random=aup-enforcement",
      },
    ],
  },
];

export function findPageBySlug(slug: string): ClerkDirectPageData | undefined {
  return clerkDirectPages.find((page) => page.slug === slug);
}
