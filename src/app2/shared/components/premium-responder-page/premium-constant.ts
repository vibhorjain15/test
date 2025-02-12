export const featureCols = [
  {
    columns: [
      {
        header: `Feature List`,
        rowspan: 2,
        bgcolor: 'white',
        postSvg: 'star2',
        style: `color: #34495E;
                  font-size: 18px;
                  gap: 10px;`,
      },
      {
        header: 'FREE',
        style: ` padding: 17px 0px 18px 0px;font-size: 16px;color:white`,
        bgcolor: '#33475B',
      },
      {
        header: `PREMIUM`,
        colspan: 3,
        bgcolor: 'linear-gradient(92deg, #0071A4 -90.74%, #004260 115.23%)',
        style: `color:white;gap: 5px;font-size: 16px;`,
        preSvg: 'glimmer',
        postSvg: 'diamond',
        tag: 'Recommended',
      },
    ],
  },
  {
    columns: [
      {
        header: 'Inbound Investor Requests Received On DV',
      },
      {
        header: 'Content Library',
      },
      {
        header: 'Digitized Standard DDQs',
      },
      {
        header: 'Digitized Requests Received Off DV',
      },
    ],
  },
];

export const featureRows = [
  {
    feature: 'Content Management',
    mainType: true,
  },
  {
    cells: [
      'Add New Strategies, Products, Vehicles',
      'cross',
      'check',
      'check',
      'check',
    ],
  },
  {
    cells: [
      'Add New Contacts, Investor Firms',
      'cross',
      'check',
      'check',
      'check',
    ],
  },
  {
    cells: ['Template Creation', 'cross', 'check', 'check', 'check'],
  },
  {
    cells: ['Create Q/A Library Content', 'cross', 'check', 'check', 'check'],
  },
  {
    cells: [
      'Add Question To Q/A Library From Project',
      'cross',
      'check',
      'check',
      'check',
    ],
  },
  {
    cells: [
      'Add/Update Expiry Date',
      'cross',
      'check',
      { content: '-', tooltip: '', bg: 'red' },
      { content: '-', tooltip: '', bg: 'red' },
    ],
  },
  {
    cells: ['Add/Update SME', 'cross', 'check', 'check', 'check'],
  },
  {
    cells: [
      'Document Repository',
      { content: 'Limited', tooltip: 'Only in projects' },
      'check',
      'check',
      'check',
    ],
  },
  {
    cells: ['Excel Bulk Upload', 'cross', 'check', 'check', 'check'],
  },
  {
    cells: [
      'Chrome Extension',
      {
        content: 'Limited',
        tooltip: 'Only Q&As answered in the past',
      },
      'check',
      'check',
      'check',
    ],
  },
  {
    cells: [
      'Outlook Add-In',
      {
        content: 'Limited',
        tooltip: 'Only Q&As answered in the past',
      },
      'check',
      'check',
      'check',
    ],
  },
  {
    cells: [
      'Word Add-In',
      {
        content: 'Limited',
        tooltip: 'Only Q&As answered in the past',
      },
      'check',
      'check',
      'check',
    ],
  },
  {
    cells: ['Tagging', 'cross', 'check', 'check', 'check'],
  },
  {
    cells: ['Excel Sync', 'check', 'check', 'check', 'check'],
  },

  {
    feature: 'Export/Output',
    mainType: true,
  },

  {
    cells: ['Stylized Word Export', 'cross', 'check', 'check', 'check'],
  },

  {
    cells: ['Export To Original Documents', 'cross', 'check', 'check', 'check'],
  },

  {
    cells: ['Export & Email', 'check', 'check', 'check', 'check'],
  },

  {
    feature: 'Automation',
    mainType: true,
  },

  {
    cells: ['Document Parser', 'cross', 'check', 'check', 'check'],
  },

  {
    cells: [
      'Suggested Responses',
      {
        content: 'Limited',
        tooltip: 'Only past responses',
      },
      'check',
      'check',
      'check',
    ],
  },

  {
    cells: ['Project / Case Tracker', 'check', 'check', 'check', 'check'],
  },

  {
    cells: ['Auto-fill', 'check', 'check', 'check', 'check'],
  },
  {
    cells: [
      'NLP Based Similarity Auto-fill',
      'cross',
      'check',
      'check',
      'check',
    ],
  },
  {
    cells: [
      'Generative AI Assistants',
      'tooltip',
      'tooltip',
      'tooltip',
      'tooltip',
    ],
  },

  {
    feature: 'Industry Benefits',
    mainType: true,
  },

  {
    cells: [
      'Industry DDQ Library (AIMA, ILPA, PRI, DEI, INREV)',
      'cross',
      'check',
      'check',
      'check',
    ],
  },

  {
    cells: [
      'On-Platform Share With Investors',
      'cross',
      'check',
      'check',
      'check',
    ],
  },

  {
    cells: ['ADV Manage Thresholds', 'cross', 'check', 'check', 'check'],
  },

  {
    cells: [
      'ADV Portfolio And Search',
      'tooltip',
      'tooltip',
      'tooltip',
      'tooltip',
    ],
  },

  {
    cells: ['New Investor Pitch (OV)', 'cross', 'check', 'check', 'check'],
  },

  {
    cells: ['Opportunity Vault Invites', 'check', 'check', 'check', 'check'],
  },

  {
    feature: 'Collaboration',
    mainType: true,
  },

  {
    cells: [
      'Recommendations Tracker',
      {
        content: 'Limited',
        tooltip: 'Only recommendations created by requestors',
      },
      'check',
      'check',
      'check',
    ],
  },
  {
    cells: [
      'Assign Subscribers To Project',
      'check',
      'check',
      'check',
      'check',
    ],
  },
  {
    cells: [
      'Assign SMEs To Subcategories And Questions',
      'check',
      'check',
      'check',
      'check',
    ],
  },
  {
    cells: [
      'Assign Multiple Reviewers And Review Workflows',
      {
        content: 'Limited',
        tooltip: 'Limited to one reviewer and step',
      },
      'check',
      'check',
      'check',
    ],
  },
  {
    cells: ['Revision Tracking', 'check', 'check', 'check', 'check'],
  },
  {
    cells: ['Assignment Tracking', 'check', 'check', 'check', 'check'],
  },
  {
    cells: ['Granular User Access Control', 'cross', 'check', 'check', 'check'],
  },
  {
    feature: 'Advanced Reports | Power BI',
    mainType: true,
  },

  {
    cells: ['Activity Dashboards', 'tooltip', 'tooltip', 'tooltip', 'tooltip'],
  },

  {
    cells: ['ADV Dashboards', 'tooltip', 'tooltip', 'tooltip', 'tooltip'],
  },

  {
    cells: [
      'Responder Diligence Dashboard',
      'tooltip',
      'tooltip',
      'tooltip',
      'tooltip',
    ],
  },

  {
    cells: [
      'Response Benchmarking Dashboard',
      'tooltip',
      'tooltip',
      'tooltip',
      'tooltip',
    ],
  },

  {
    cells: ['Multi-page Export', 'tooltip', 'tooltip', 'tooltip', 'tooltip'],
  },
];

export const quotations = [
  {
    text: `It is so much easier for everybody to capture the information and work on it piecemeal and 
share questions with people in my organization…and it’s a great product`,
    from1: '$4bn Asset Manager',
    from2: 'Head of Investor Relations',
    rating: [1, 1, 1, 1, 1],
  },
  {
    text: `Quick response and provided instructions to resolve my request. Thank you!`,
    from1: '20bn+ FUND leveraged',
    from2: 'Credit asset manager',
    rating: [1, 1, 1, 1, 0],
  },

  {
    text: `Thanks for getting the authentication logs reporting enhanced as we requested.We appreciate the fast action`,
    from1: 'Large Insurance Company',
    from2: 'Portfolio Manager',
    rating: [1, 1, 1, 1, 1],
  },
  {
    text: `DV is very easy to use even for new hires. GP feedback is also very positive. 
We love how responsive Team DV is if we have a question or need support`,
    from1: 'US Plan Sponsor',
    from2: 'Plan Administrator',
    rating: [1, 1, 1, 1, 1],
  },

  {
    text: `It’s the difference between night and day how much more efficient we’ve become by using DiligenceVault.`,
    from1: 'Investment Firm',
    from2: 'Operations Director',
    rating: [1, 1, 1, 1, 0],
  },

  {
    text: `We would not have been able to successfully complete our last fundraise without DV.`,
    from1: 'Private Equity Firm',
    from2: 'Fundraising Manager',
    rating: [1, 1, 1, 1, 1],
  },

  {
    text: `Such an easy-to-use platform with robust features.`,
    from1: 'Financial Services Company',
    from2: 'Head of Portfolio Management',
    rating: [1, 1, 1, 1, 1],
  },
];

export const FAQs = [
  {
    question: 'What is included in the Premium version of DiligenceVault?',
    answer:
      'The core modules are: <ul> <li>Content Management </li> <li>RFP/DDQ Automation </li> <li>Database Profile Management </li> <li> Standard DDQ Distribution </li></ul> Together, these 4 create a centralized location for all approved Q/A content and firm or fund DDQs. The advanced autofill feature will help save time completing RFPs, RFIs and DDQs by pre-filling answers from your content library',
    open: false,
  },
  {
    question:
      'Can I upload my own Firm/Fund DDQs to use for DiligenceVault questionnaires?',
    answer:
      'Yes. As a free user, you can re-use answers that have already been submitted to investors via DiligenceVault. As a premium user, you can proactively upload your DDQs or approved answers and use those to autofill questionnaires. You can use that information for Investor questionnaires sent on DiligenceVault, or for ones that you receive in Word/Excel. Our plug-ins will also work for any other portals where your team is uploading data',
    open: false,
  },
  {
    question:
      'Can I automatically sync data from external sources into DiligenceVault?',
    answer:
      'Yes. You can bulk upload previously completed RFPs, DDQs or RFIs. You can also directly sync Firm and Contact-level information with Salesforce or Microsoft Dynamics integrations',
    open: false,
  },
  {
    question: 'What kind of support can I expect from DiligenceVault?',
    answer:
      'Our dedicated client success team will work directly with you and your team for all onboarding, training and support. They will help with account setup, uploading your DDQs, and custom training based on your priorities',
    open: false,
  },
  {
    question:
      'I already have an existing software to manage content. Should I consider switching?',
    answer:
      'Several clients have chosen DiligenceVault as their software provider for managing content and automating DDQs and RFPs. As more investors adopt DiligenceVault, managers have noticed a larger % of questionnaires are being sent through DiligenceVault. For them, it made sense to switch to DiligenceVault because we have all of the features offered by comparable tools, such as: Q/A library, Microsoft Word/Excel Plug-Ins, autofill, and DDQ maintenance',
    open: false,
  },
];

export const booksSvg = `<svg
    xmlns="http://www.w3.org/2000/svg"
    width="49"
    height="49"
    viewBox="0 0 49 49"
    fill="none"
  >
    <path
      d="M10.4729 2.14355H3.58638C2.63555 2.14355 1.86475 2.91436 1.86475 3.86519V45.1845C1.86475 46.1352 2.63555 46.9061 3.58638 46.9061H10.4729C11.4238 46.9061 12.1946 46.1352 12.1946 45.1845V3.86519C12.1946 2.91436 11.4238 2.14355 10.4729 2.14355Z"
      fill="#65B1E1"
    />
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M12.1938 32.2725H1.86475V37.437H12.1938V32.2725Z"
      fill="#006395"
    />
    <path
      d="M24.2461 7.30859H17.3596C16.4088 7.30859 15.6379 8.07941 15.6379 9.03023V45.1846C15.6379 46.1353 16.4088 46.9062 17.3596 46.9062H24.2461C25.197 46.9062 25.9678 46.1353 25.9678 45.1846V9.03023C25.9678 8.07941 25.197 7.30859 24.2461 7.30859Z"
      fill="#006395"
    />
    <path
      d="M37.2107 8.03333C36.9645 7.1149 36.0207 6.56983 35.102 6.81592L28.4503 8.5983C27.5319 8.84439 26.9868 9.78843 27.2329 10.7069L36.5902 45.6292C36.8364 46.5479 37.7806 47.0929 38.6989 46.8467L45.3509 45.0645C46.2693 44.8183 46.8143 43.8742 46.5681 42.9558L37.2107 8.03333Z"
      fill="#65B1E1"
    />
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M42.9402 29.4189L32.9631 32.0923L34.2998 37.0808L44.2768 34.4075L42.9402 29.4189Z"
      fill="#006395"
    />
  </svg>`;

export const fileSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="31" height="42" viewBox="0 0 31 42" fill="none">
<path d="M0 5.36471C0 2.40185 2.40185 0 5.36471 0H25.0353C27.9982 0 30.4 2.40185 30.4 5.36471V35.7647C30.4 38.7275 27.9982 41.1294 25.0353 41.1294H5.36471C2.40185 41.1294 0 38.7275 0 35.7647V5.36471Z" fill="#65B1E1"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M5.81054 8.94135C5.81054 7.70682 6.81134 6.70605 8.04583 6.70605H22.3517C23.5862 6.70605 24.587 7.70682 24.587 8.94135C24.587 10.1759 23.5862 11.1766 22.3517 11.1766H8.04583C6.81134 11.1766 5.81054 10.1759 5.81054 8.94135ZM5.81229 17.8825C5.81229 16.648 6.81306 15.6472 8.04758 15.6472H22.3535C23.588 15.6472 24.5888 16.648 24.5888 17.8825C24.5888 19.1171 23.588 20.1178 22.3535 20.1178H8.04758C6.81306 20.1178 5.81229 19.1171 5.81229 17.8825ZM8.04486 24.5884C6.81034 24.5884 5.80957 25.5892 5.80957 26.8237C5.80957 28.0583 6.81034 29.059 8.04486 29.059H15.1978C16.4323 29.059 17.4331 28.0583 17.4331 26.8237C17.4331 25.5892 16.4323 24.5884 15.1978 24.5884H8.04486Z" fill="#006395"/>
</svg>`;

export const starSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="23" height="26" viewBox="0 0 23 26" fill="none">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M13.0445 4.0818C12.52 2.6394 10.48 2.63941 9.95553 4.0818L7.5892 10.5892L1.0818 12.9555C-0.360604 13.48 -0.360595 15.52 1.0818 16.0445L7.5892 18.4108L9.95553 24.9182C10.48 26.3606 12.52 26.3606 13.0445 24.9182L15.4108 18.4108L21.9182 16.0445C23.3606 15.52 23.3606 13.48 21.9182 12.9555L15.4108 10.5892L13.0445 4.0818Z" fill="#65B1E1"/>
</svg>`;

export const settingSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
  <g clip-path="url(#clip0_580_2317)">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M19.1213 5.79141C21.8203 5.06504 24.6472 4.9491 27.3967 5.45202C30.1461 5.95493 32.749 7.06407 35.0161 8.69884L32.9247 10.7903C32.6855 11.0302 32.5228 11.3356 32.457 11.668C32.3913 12.0004 32.4255 12.3447 32.5554 12.6576C32.6853 12.9706 32.9049 13.238 33.1867 13.4261C33.4684 13.6143 33.7996 13.7148 34.1384 13.7148H42.0001C42.4548 13.7148 42.8908 13.5342 43.2123 13.2127C43.5338 12.8912 43.7144 12.4552 43.7144 12.0006V4.13884C43.7143 3.79963 43.6136 3.46807 43.425 3.18612C43.2364 2.90417 42.9684 2.6845 42.655 2.55492C42.3415 2.42535 41.9966 2.39168 41.664 2.45819C41.3314 2.5247 41.0259 2.68839 40.7864 2.92855L38.6881 5.02684C34.841 2.04881 30.1795 0.310485 25.3218 0.0423445C20.4642 -0.225796 15.6397 0.988919 11.4882 3.52542C7.33667 6.06193 4.05418 9.8004 2.07598 14.2451C0.0977829 18.6899 -0.482689 23.6309 0.411535 28.4131C0.473895 28.7452 0.601046 29.0617 0.785731 29.3446C0.970416 29.6275 1.20902 29.8713 1.48791 30.062C1.76681 30.2527 2.08053 30.3866 2.41118 30.4561C2.74182 30.5255 3.08291 30.5292 3.41496 30.4668C3.74702 30.4045 4.06354 30.2773 4.34646 30.0926C4.62938 29.908 4.87315 29.6694 5.06385 29.3905C5.25456 29.1116 5.38846 28.7978 5.45792 28.4672C5.52738 28.1366 5.53104 27.7955 5.46868 27.4634C4.597 22.7956 5.51876 17.9708 8.04977 13.9531C10.5808 9.93538 14.5346 7.02067 19.1213 5.79141ZM47.5887 19.588C47.4627 18.9174 47.0756 18.3242 46.5123 17.9391C45.9491 17.5539 45.2559 17.4083 44.5852 17.5343C43.9146 17.6602 43.3215 18.0474 42.9364 18.6106C42.5512 19.1739 42.4056 19.8671 42.5315 20.5377C43.2233 24.2398 42.7904 28.0643 41.2886 31.5181C39.7869 34.972 37.2852 37.8969 34.1059 39.916C30.9267 41.935 27.2156 42.9556 23.451 42.8462C19.6864 42.7369 16.0408 41.5025 12.9841 39.3023L15.0755 37.2108C15.3149 36.9707 15.4777 36.6649 15.5433 36.3323C15.609 35.9996 15.5744 35.6549 15.4442 35.3419C15.3139 35.0288 15.0937 34.7614 14.8114 34.5735C14.5291 34.3856 14.1975 34.2857 13.8584 34.2863H6.00011C5.54545 34.2863 5.10941 34.4669 4.78792 34.7884C4.46643 35.1099 4.28582 35.5459 4.28582 36.0005V43.8623C4.28589 44.2015 4.3866 44.533 4.57518 44.815C4.76377 45.0969 5.03176 45.3166 5.34525 45.4462C5.65873 45.5758 6.00361 45.6094 6.33623 45.5429C6.66885 45.4764 6.97427 45.3127 7.21382 45.0725L9.31211 42.9743C13.159 45.9519 17.8201 47.69 22.6773 47.9582C27.5346 48.2263 32.3586 47.0119 36.5099 44.4759C40.6613 41.9399 43.9438 38.2021 45.9223 33.758C47.9009 29.3138 48.482 24.3733 47.5887 19.5914V19.588Z" fill="#65B1E1"/>
    <path fill-rule="evenodd" clip-rule="evenodd" d="M21.5326 14.0429L20.8328 15.849L18.4236 17.2154L16.5041 16.9222C16.184 16.8785 15.8581 16.931 15.568 17.0731C15.2778 17.2153 15.0365 17.4405 14.8748 17.7202L14.2249 18.8598C14.058 19.1436 13.9811 19.4713 14.0043 19.7997C14.0275 20.1281 14.1497 20.4417 14.3549 20.6992L15.5746 22.2122V24.9478L14.3881 26.4608C14.183 26.7183 14.0608 27.0319 14.0375 27.3603C14.0143 27.6887 14.0913 28.0164 14.2581 28.3002L14.908 29.4398C15.0698 29.7195 15.3111 29.9447 15.6012 30.0869C15.8914 30.229 16.2172 30.2815 16.5374 30.2378L18.4569 29.9446L20.8344 31.3109L21.5341 33.1186C21.6519 33.4242 21.8592 33.6871 22.1289 33.8729C22.3986 34.0587 22.7181 34.1588 23.0456 34.16H24.4134C24.7416 34.1593 25.0619 34.0593 25.3322 33.8731C25.6025 33.687 25.8101 33.4234 25.9279 33.1171L26.6277 31.3109L29.0036 29.9446L30.9231 30.2378C31.2433 30.2815 31.5691 30.229 31.8593 30.0869C32.1494 29.9447 32.3907 29.7195 32.5525 29.4398L33.2024 28.3002C33.3692 28.0164 33.4462 27.6887 33.423 27.3603C33.3997 27.0319 33.2775 26.7183 33.0724 26.4608L31.8527 24.9478V22.2122L33.0406 20.6992C33.2458 20.4417 33.368 20.1281 33.3912 19.7997C33.4144 19.4713 33.3375 19.1436 33.1706 18.8598L32.5207 17.7202C32.3591 17.4404 32.1179 17.215 31.8277 17.0729C31.5375 16.9307 31.2115 16.8783 30.8914 16.9222L28.9719 17.2154L26.5944 15.849L25.8946 14.0414C25.7766 13.7357 25.569 13.4727 25.299 13.2869C25.0291 13.1011 24.7094 13.0011 24.3817 13H23.0456C22.7177 13.0012 22.3978 13.1015 22.1279 13.2875C21.8579 13.4736 21.6504 13.7369 21.5326 14.0429ZM23.7136 26.9807C24.1602 26.9807 24.6024 26.8927 25.015 26.7218C25.4276 26.5509 25.8025 26.3004 26.1183 25.9847C26.4341 25.6689 26.6846 25.294 26.8555 24.8814C27.0264 24.4688 27.1143 24.0266 27.1143 23.58C27.1143 23.1334 27.0264 22.6912 26.8555 22.2786C26.6846 21.866 26.4341 21.4911 26.1183 21.1753C25.8025 20.8595 25.4276 20.609 25.015 20.4381C24.6024 20.2672 24.1602 20.1793 23.7136 20.1793C22.8117 20.1793 21.9467 20.5376 21.309 21.1753C20.6712 21.8131 20.3129 22.6781 20.3129 23.58C20.3129 24.4819 20.6712 25.3469 21.309 25.9847C21.9467 26.6224 22.8117 26.9807 23.7136 26.9807Z" fill="#006395"/>
  </g>
  <defs>
    <clipPath id="clip0_580_2317">
      <rect width="48" height="48" fill="white"/>
    </clipPath>
  </defs>
</svg>`;

export const monitorSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M18.9409 34.9021C19.0388 34.6277 19.2191 34.3902 19.457 34.2221C19.695 34.0539 19.9791 33.9634 20.2705 33.9629H25.3343C25.6257 33.9634 25.9098 34.0539 26.1478 34.2221C26.3857 34.3902 26.566 34.6277 26.6639 34.9021L28.6074 40.328H31.2892C31.852 40.328 32.3916 40.5516 32.7895 40.9495C33.1874 41.3474 33.411 41.887 33.411 42.4497C33.411 43.0124 33.1874 43.5521 32.7895 43.95C32.3916 44.3479 31.852 44.5714 31.2892 44.5714H14.3156C13.7528 44.5714 13.2132 44.3479 12.8153 43.95C12.4174 43.5521 12.1938 43.0124 12.1938 42.4497C12.1938 41.887 12.4174 41.3474 12.8153 40.9495C13.2132 40.5516 13.7528 40.328 14.3156 40.328H16.9974L18.9381 34.9021H18.9409Z" fill="#006395"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M7.12178 6.39453C4.84447 6.39453 3 8.23901 3 10.5163V31.9767C3 34.254 4.84447 36.0985 7.12178 36.0985H38.4835C40.7608 36.0985 42.6053 34.254 42.6053 31.9767V10.5163C42.6053 8.23901 40.7608 6.39453 38.4835 6.39453H7.12178Z" fill="#65B1E1"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M8.9139 8.6582C6.89686 8.6582 5.26318 10.204 5.26318 12.1126V30.0985C5.26318 32.0071 6.89686 33.5529 8.9139 33.5529H36.6914C38.7085 33.5529 40.3421 32.0071 40.3421 30.0985V12.1126C40.3421 10.204 38.7085 8.6582 36.6914 8.6582H8.9139Z" fill="white" fill-opacity="0.3"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M26.8036 3C26.1926 3 25.6067 3.2427 25.1747 3.6747C24.7427 4.1067 24.5 4.69263 24.5 5.30357V9.79554C24.5 10.4065 24.7427 10.9924 25.1747 11.4244C25.6067 11.8564 26.1926 12.0991 26.8036 12.0991H43.6964C44.3074 12.0991 44.8933 11.8564 45.3253 11.4244C45.7573 10.9924 46 10.4065 46 9.79554V5.30357C46 4.69263 45.7573 4.1067 45.3253 3.6747C44.8933 3.2427 44.3074 3 43.6964 3H26.8036ZM24.5 16.4544C24.5 15.8434 24.7427 15.2575 25.1747 14.8255C25.6067 14.3935 26.1926 14.1508 26.8036 14.1508H43.6964C44.3074 14.1508 44.8933 14.3935 45.3253 14.8255C45.7573 15.2575 46 15.8434 46 16.4544V20.9464C46 21.5573 45.7573 22.1432 45.3253 22.5752C44.8933 23.0072 44.3074 23.2499 43.6964 23.2499H26.8036C26.1926 23.2499 25.6067 23.0072 25.1747 22.5752C24.7427 22.1432 24.5 21.5573 24.5 20.9464V16.4544Z" fill="#006395"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M29.3698 5.82227C29.1429 5.82227 28.9182 5.86695 28.7086 5.95378C28.499 6.0406 28.3085 6.16786 28.1481 6.32829C27.9877 6.48872 27.8604 6.67918 27.7736 6.88879C27.6868 7.0984 27.6421 7.32306 27.6421 7.54994C27.6421 7.77683 27.6868 8.00149 27.7736 8.2111C27.8604 8.42071 27.9877 8.61117 28.1481 8.7716C28.3085 8.93203 28.499 9.05929 28.7086 9.14611C28.9182 9.23294 29.1429 9.27762 29.3698 9.27762C29.828 9.27762 30.2674 9.0956 30.5914 8.7716C30.9154 8.44759 31.0974 8.00815 31.0974 7.54994C31.0974 7.09174 30.9154 6.65229 30.5914 6.32829C30.2674 6.00429 29.828 5.82227 29.3698 5.82227ZM27.6421 18.6992C27.6421 18.4723 27.6868 18.2477 27.7736 18.0381C27.8604 17.8285 27.9877 17.638 28.1481 17.4776C28.3085 17.3171 28.499 17.1899 28.7086 17.1031C28.9182 17.0162 29.1429 16.9716 29.3698 16.9716C29.5967 16.9716 29.8213 17.0162 30.0309 17.1031C30.2405 17.1899 30.431 17.3171 30.5914 17.4776C30.7519 17.638 30.8791 17.8285 30.9659 18.0381C31.0528 18.2477 31.0974 18.4723 31.0974 18.6992C31.0974 19.1574 30.9154 19.5969 30.5914 19.9209C30.2674 20.2449 29.828 20.4269 29.3698 20.4269C28.9116 20.4269 28.4721 20.2449 28.1481 19.9209C27.8241 19.5969 27.6421 19.1574 27.6421 18.6992ZM35.0581 7.54994C35.0581 7.01859 35.4881 6.59012 36.0179 6.59012H41.3929C41.6474 6.59012 41.8916 6.69125 42.0716 6.87125C42.2516 7.05125 42.3527 7.29538 42.3527 7.54994C42.3527 7.8045 42.2516 8.04864 42.0716 8.22864C41.8916 8.40864 41.6474 8.50977 41.3929 8.50977H36.0179C35.7633 8.50977 35.5192 8.40864 35.3392 8.22864C35.1592 8.04864 35.0581 7.8045 35.0581 7.54994ZM36.0179 17.7394C35.7633 17.7394 35.5192 17.8405 35.3392 18.0205C35.1592 18.2005 35.0581 18.4447 35.0581 18.6992C35.0581 18.9538 35.1592 19.1979 35.3392 19.3779C35.5192 19.5579 35.7633 19.6591 36.0179 19.6591H41.3929C41.6474 19.6591 41.8916 19.5579 42.0716 19.3779C42.2516 19.1979 42.3527 18.9538 42.3527 18.6992C42.3527 18.4447 42.2516 18.2005 42.0716 18.0205C41.8916 17.8405 41.6474 17.7394 41.3929 17.7394H36.0179Z" fill="#65B1E1"/>
</svg>`;
export const line = `<svg xmlns="http://www.w3.org/2000/svg" width="57" height="34" viewBox="0 0 57 34" fill="none">
  <path d="M1.50366 32.2789C11.4932 25.2274 19.9059 15.9898 29.6026 8.53073C32.8913 6.00096 34.4732 20.1643 34.8598 22.3083C35.4099 25.3584 36.629 22.6175 37.9719 21.1299C41.5066 17.2145 45.1618 13.432 48.577 9.40694C50.6605 6.95134 52.5197 4.10453 54.801 1.82324" stroke="#F0592B" stroke-width="3" stroke-linecap="round"/>
</svg>`;
export const arrow = `<svg xmlns="http://www.w3.org/2000/svg" width="19" height="14" viewBox="0 0 19 14" fill="none">
  <path d="M1.74512 6.71776C3.60029 6.2118 16.0618 0.780651 16.3082 1.58139C17.2503 4.64303 16.4291 8.90681 16.4291 12.1563" stroke="#F0592B" stroke-width="3" stroke-linecap="round"/>
</svg>`;
export const spiralArrow = `<svg  xmlns="http://www.w3.org/2000/svg" width="93" height="81" viewBox="0 0 93 81" fill="none">
  <path d="M90.7495 2.83271C85.7029 22.5566 81.4453 37.6092 64.8912 47.3927C56.9897 52.0625 49.4619 50.8512 45.0342 43.3709C36.9771 29.7587 61.5155 20.6101 62.0968 35.1169C63.1624 61.7111 34.2231 72.8992 18.496 70.034C13.9129 69.199 8.73047 68.139 4.39736 66.6754C0.638837 65.406 4.43603 68.5049 5.50806 69.6787C7.4941 71.8533 8.66482 74.6044 10.6062 76.7301C14.0032 80.4497 11.153 76.4151 9.50298 74.8405C4.76981 70.3237 -0.40718 67.9896 8.24396 62.5722C9.98492 61.482 18.6597 55.1148 18.1483 56.7188C16.6984 61.2663 16.812 67.047 15.2756 71.2257C13.1725 76.9457 13.3193 80.6392 13.6592 71.9776C13.7701 69.1514 14.181 66.4962 14.3929 63.7162C14.7421 59.1349 13.4058 65.2938 13.4891 65.8769C13.7309 67.5706 12.5563 71.4479 12.8677 67.3624C12.9479 66.3105 13.7978 62.0266 13.2849 63.2528C11.6655 67.1244 12.4186 73.4253 11.0281 71.1944C9.85964 69.3196 10.2419 67.6826 11.3616 65.3044C11.7428 64.4948 14.7743 62.2385 14.1914 63.632"  stroke="#C1E4FD"  stroke-width="4"  stroke-linecap="round" class="spiral-svg"/>
</svg>`;
export const star2 = `<svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 19 19" fill="none">
                <g clip-path="url(#clip0_580_2234)">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M8.22411 0.898346C8.65741 -0.299453 10.3426 -0.299445 10.7759 0.898348L12.7307 6.30222L18.1063 8.26728C19.2979 8.70283 19.2979 10.3969 18.1063 10.8324L12.7307 12.7975L10.7759 18.2013C10.3426 19.3991 8.65741 19.3991 8.22411 18.2013L6.26932 12.7975L0.893686 10.8324C-0.297894 10.3969 -0.297894 8.70283 0.893686 8.26727L6.26932 6.30222L8.22411 0.898346Z" fill="#65B1E1"/>
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M2.48037 4.33403C1.93978 3.18067 3.13139 1.98908 4.28473 2.52967L9.48809 4.96854L14.6788 2.55686C15.8293 2.02229 17.0272 3.22015 16.4926 4.37069L14.0809 9.56136L16.5198 14.7647C17.0604 15.9181 15.8688 17.1097 14.7154 16.5691L9.51206 14.1302L4.32142 16.5419C3.17086 17.0765 1.97301 15.8786 2.50759 14.728L4.91924 9.53739L2.48037 4.33403Z" fill="#65B1E1"/>
                </g>
                <defs>
                  <clipPath id="clip0_580_2234">
                    <rect width="19" height="19" transform="matrix(-1 0 0 1 19 0)" fill="white"/>
                  </clipPath>
                </defs>
              </svg>`;
export const glimmer = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none">
  <path d="M6.78434 10.1468C6.86152 9.95107 7.13847 9.95107 7.21565 10.1468L7.91241 11.9134C7.94384 11.9931 8.0069 12.0561 8.08655 12.0876L9.85324 12.7843C10.0489 12.8615 10.0489 13.1385 9.85324 13.2157L8.08655 13.9124C8.0069 13.9438 7.94384 14.0069 7.91241 14.0866L7.21565 15.8532C7.13847 16.0489 6.86152 16.0489 6.78434 15.8532L6.08758 14.0866C6.05615 14.0069 5.99309 13.9438 5.91344 13.9124L4.14679 13.2157C3.95107 13.1385 3.95107 12.8615 4.14679 12.7843L5.91344 12.0876C5.99309 12.0561 6.05615 11.9931 6.08758 11.9134L6.78434 10.1468Z" fill="#FFE600" stroke="#FFE600" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M16.3203 15.1223C16.3846 14.9592 16.6154 14.9592 16.6797 15.1223L17.2603 16.5945C17.2865 16.6609 17.3391 16.7135 17.4055 16.7397L18.8777 17.3203C19.0408 17.3846 19.0408 17.6154 18.8777 17.6797L17.4055 18.2603C17.3391 18.2865 17.2865 18.3391 17.2603 18.4055L16.6797 19.8777C16.6154 20.0408 16.3846 20.0408 16.3203 19.8777L15.7397 18.4055C15.7135 18.3391 15.6609 18.2865 15.5945 18.2603L14.1223 17.6797C13.9592 17.6154 13.9592 17.3846 14.1223 17.3203L15.5945 16.7397C15.6609 16.7135 15.7135 16.6609 15.7397 16.5945L16.3203 15.1223Z" fill="#FFE600" stroke="#FFE600" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M15.7125 3.19572C15.8154 2.93476 16.1846 2.93476 16.2875 3.19572L17.2165 5.55125C17.2585 5.65746 17.3425 5.74153 17.4487 5.78345L19.8043 6.71246C20.0652 6.81536 20.0652 7.18463 19.8043 7.28753L17.4487 8.21654C17.3425 8.25846 17.2585 8.34253 17.2165 8.44873L16.2875 10.8043C16.1846 11.0652 15.8154 11.0652 15.7125 10.8043L14.7834 8.44873C14.7415 8.34253 14.6575 8.25846 14.5513 8.21654L12.1957 7.28753C11.9348 7.18463 11.9348 6.81536 12.1957 6.71246L14.5513 5.78345C14.6575 5.74153 14.7415 5.65746 14.7834 5.55125L15.7125 3.19572Z" fill="#FFE600" stroke="#FFE600" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export const diamond = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none">
  <path d="M20.0268 10.223L20.3451 9.90472C20.7816 9.46825 20.8737 8.79445 20.5705 8.25687L18.1169 3.90744C17.8732 3.4753 17.4155 3.20801 16.9194 3.20801H5.08098C4.58484 3.20801 4.12717 3.4753 3.8834 3.90744L1.42988 8.25687C1.12662 8.79445 1.21876 9.46825 1.65521 9.90472L10.352 18.6015C10.71 18.9595 11.2904 18.9595 11.6483 18.6015L13.0627 17.1872" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M1.375 9.16602H12.8333" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M16.1805 9.51942C16.2949 9.2292 16.7056 9.2292 16.82 9.51942L17.8532 12.1391C17.8998 12.2572 17.9933 12.3507 18.1114 12.3973L20.7311 13.4305C21.0213 13.5449 21.0213 13.9556 20.7311 14.07L18.1114 15.1032C17.9933 15.1498 17.8998 15.2433 17.8532 15.3614L16.82 17.9811C16.7056 18.2713 16.2949 18.2713 16.1805 17.9811L15.1473 15.3614C15.1007 15.2433 15.0072 15.1498 14.8891 15.1032L12.2694 14.07C11.9792 13.9556 11.9792 13.5449 12.2694 13.4305L14.8891 12.3973C15.0072 12.3507 15.1007 12.2572 15.1473 12.1391L16.1805 9.51942Z" fill="#FFE600" stroke="#FFE600" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M8.60382 3.20801L7.2493 8.58893C7.15484 8.96422 7.18156 9.35976 7.32562 9.71895L10.9959 18.87H11.0037" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M13.3955 3.20801L14.2031 6.41634" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
export const cross = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M17.5314 6.46863C18.1562 7.09347 18.1562 8.10653 17.5314 8.73137L8.73137 17.5314C8.10653 18.1562 7.09347 18.1562 6.46863 17.5314C5.84379 16.9065 5.84379 15.8935 6.46863 15.2686L15.2686 6.46863C15.8935 5.84379 16.9065 5.84379 17.5314 6.46863Z" fill="#DC3545"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M6.46863 6.46863C7.09347 5.84379 8.10653 5.84379 8.73137 6.46863L17.5314 15.2686C18.1562 15.8935 18.1562 16.9065 17.5314 17.5314C16.9065 18.1562 15.8935 18.1562 15.2686 17.5314L6.46863 8.73137C5.84379 8.10653 5.84379 7.09347 6.46863 6.46863Z" fill="#DC3545"/>
</svg>`;
export const doubleQuotes = `<svg xmlns="http://www.w3.org/2000/svg" width="37" height="33" viewBox="0 0 37 33" fill="none">
  <path d="M13.9079 32.364C13.7702 32.3686 13.633 32.346 13.5031 32.2977C10.5735 31.22 8.11573 29.7109 6.16883 27.7551C4.2007 25.809 2.82351 23.5473 2.09895 21.02C1.38186 18.5504 1.04199 15.3177 1.02187 11.2524L0.972949 1.36683C0.97153 1.05672 1.08721 0.758789 1.29456 0.538305C1.5019 0.31782 1.78383 0.193123 2.07856 0.191357L15.212 0.118272C15.5067 0.116754 15.7899 0.238322 15.9994 0.456476C16.2088 0.674625 16.3274 0.971264 16.3291 1.28138L16.3975 15.1004C16.3989 15.4105 16.2833 15.7084 16.076 15.9289C15.8686 16.1493 15.5867 16.2741 15.292 16.2759L15.1276 16.2768C12.4333 16.2918 10.0778 18.8234 11.6312 21.024C12.5722 22.3569 14.2403 23.5082 16.7542 24.3639C17.0572 24.4672 17.3038 24.7026 17.431 25.01C17.5581 25.3174 17.5537 25.6674 17.419 25.9713L14.8767 31.6903C14.7899 31.8856 14.6535 32.0519 14.4826 32.1708C14.3116 32.2896 14.1127 32.3567 13.9079 32.364ZM33.0502 32.2575C32.9126 32.2621 32.7754 32.2395 32.6454 32.1912C29.716 31.1134 27.2581 29.6044 25.3112 27.6485C23.3431 25.7025 21.9656 23.4408 21.2413 20.9135C20.5242 18.4439 20.1844 15.2112 20.1642 11.1458L20.1153 1.26031C20.1139 0.949835 20.2299 0.65139 20.4376 0.430935C20.6454 0.210463 20.9279 0.0859948 21.223 0.0848219L34.3544 0.0117487C34.649 0.0102313 34.9322 0.131799 35.1416 0.349954C35.3512 0.568102 35.4698 0.864741 35.4714 1.17486L35.5398 14.9939C35.5412 15.304 35.4256 15.6019 35.2182 15.8224C35.011 16.0427 34.7289 16.1676 34.4343 16.1693L34.27 16.1703C31.5756 16.1852 29.2202 18.7169 30.7736 20.9175C31.7145 22.2504 33.3828 23.4016 35.8966 24.2574C36.1997 24.3606 36.446 24.5961 36.5732 24.9035C36.7003 25.2108 36.696 25.5609 36.5614 25.8648L34.019 31.5837C33.9321 31.7791 33.7958 31.9454 33.6248 32.0642C33.4538 32.1831 33.2551 32.2501 33.0502 32.2575Z" fill="#0071A4"/>
</svg>
`;
export const circleMinus = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
  <path d="M8 12H16M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
export const circlePlus = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
  <path d="M12 8V16M8 12H16M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
