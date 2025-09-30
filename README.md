# 🌐 West Michigan AWS User Group Website

[![AWS CDK](https://img.shields.io/badge/AWS-CDK-orange?logo=amazon-aws)](https://aws.amazon.com/cdk/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?logo=typescript)](https://www.typescriptlang.org/)
[![CloudFront](https://img.shields.io/badge/CloudFront-S3-green?logo=amazon-aws)](https://aws.amazon.com/cloudfront/)

Official website for the West Michigan AWS User Group (WMAUG), deployed on AWS using Infrastructure as Code (IaC) with AWS CDK.

**Live Site:** [wmaug.org](https://wmaug.org)

---

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Development](#-development)
- [Deployment](#-deployment)
- [GitHub Activity Contest](#-github-activity-contest)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 🎯 Core Features
- **Responsive Design** - Mobile-first design that works on all devices
- **Event Newsfeed** - Dynamic display of upcoming and past WMAUG events
- **Sponsors Showcase** - Alphabetically sorted sponsor cards with logos
- **Social Integration** - Quick links to Discord, GitHub, and Meetup

### 🏆 GitHub Activity Contest
- **Live Competition** - Real-time tracking of GitHub activity between contributors
- **Normalized Scoring** - Fair scoring system based on:
  - 60% weight: Number of commits
  - 40% weight: Lines changed (additions + deletions)
- **User Profiles** - GitHub stats including repos, followers, and following
- **Commit Feed** - Scrollable feed showing recent commits with detailed statistics
- **Collapsible UI** - Toggle to expand/collapse the GitHub section
- **Jump Navigation** - Quick access button to skip to newsfeed

### 🎨 Design Features
- **Custom Theme** - Purple gradient design matching AWS branding
- **Smooth Animations** - CSS transitions and hover effects
- **Custom Scrollbars** - Styled scrollbars matching site theme
- **Winner Highlighting** - Golden gradient and glow effects for contest leader

---

## 🏗️ Architecture

The website is deployed as a serverless static site on AWS with the following components:

```
┌─────────────────┐
│   Route 53      │  DNS Management
│   (wmaug.org)   │
└────────┬────────┘
         │
┌────────▼────────┐
│  CloudFront     │  CDN + HTTPS (TLS 1.2+)
│  Distribution   │  - Custom certificate
│                 │  - WWW → Non-WWW redirect
└────────┬────────┘
         │
┌────────▼────────┐
│   S3 Bucket     │  Static Website Hosting
│  (wmaug.org)    │  - Private bucket
│                 │  - OAI access only
└─────────────────┘
```

### Security Features
- **HTTPS Only** - Enforced via CloudFront
- **Security Headers** - HSTS, XSS Protection, Frame Options
- **Private S3 Bucket** - Access only via CloudFront OAI
- **TLS 1.2+** - Modern encryption protocols

---

## 📁 Project Structure

```
WMAUG-Website/
├── app/                        # Frontend application
│   ├── index.html             # Main HTML page
│   ├── css/
│   │   └── index.css          # Styles with responsive design
│   ├── js/
│   │   ├── index.js           # Main JavaScript logic
│   │   └── data.js            # Event and sponsor data
│   └── assets/                # Images and media
│       ├── newsfeed/          # Event banners
│       ├── sponsors/          # Sponsor logos
│       ├── wmaug-logo.webp    # Main logo
│       └── wmaug-name.png     # Header logo
│
├── lib/
│   └── website-stack.ts       # CDK infrastructure definition
│
├── bin/
│   └── website.ts             # CDK app entry point
│
├── test/
│   └── website.test.ts        # Jest tests
│
├── cdk.json                   # CDK configuration
├── package.json               # Node dependencies
├── tsconfig.json              # TypeScript config
└── README.md                  # This file
```

---

## 🔧 Prerequisites

- **Node.js** - v18+ recommended
- **npm** - v9+ recommended
- **AWS Account** - With appropriate permissions
- **AWS CLI** - Configured with credentials
- **Domain** - Registered domain (wmaug.org) with Route53 hosted zone

---

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/West-Michigan-AWS-Users-Group/WMAUG-Website.git
   cd WMAUG-Website
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the TypeScript CDK code**
   ```bash
   npm run build
   ```

---

## 💻 Development

### Local Development

The website is a static site. You can preview it locally:

```bash
# Serve the app directory with any static file server
npx http-server app/

# Or use Python
python3 -m http.server 8000 --directory app/
```

Then open `http://localhost:8000` in your browser.

### Code Formatting

```bash
npm run fix
```

Uses Prettier to format all files.

### Testing

```bash
npm test
```

Runs Jest tests for CDK infrastructure.

### Watch Mode

```bash
npm run watch
```

Watches for TypeScript changes and recompiles automatically.

---

## 🚀 Deployment

### First-time Setup

1. **Set AWS environment variables**
   ```bash
   export CDK_DEFAULT_ACCOUNT=123456789012
   export CDK_DEFAULT_REGION=us-east-1
   ```

2. **Bootstrap CDK** (one-time per account/region)
   ```bash
   cdk bootstrap
   ```

3. **Ensure Route53 hosted zone exists** for your domain

### Deploy to AWS

```bash
# Synthesize CloudFormation template
npm run cdk synth

# Deploy to AWS
npm run cdk deploy

# Or with environment variables inline
CDK_DEFAULT_ACCOUNT=123456789012 CDK_DEFAULT_REGION=us-east-1 cdk deploy
```

### Deployment Flow

1. **CDK synthesizes** CloudFormation template
2. **Stack creates/updates**:
   - S3 bucket with website content
   - CloudFront distribution with custom domain
   - Route53 A records (apex + www)
   - ACM certificate (if needed)
3. **Assets deployed** to S3 bucket
4. **CloudFront invalidation** triggered for `/*`

### Post-Deployment

- Website is live at `https://wmaug.org`
- CloudFront may take 10-20 minutes to fully propagate
- Check deployment output for CloudFront distribution URL

---

## 🏆 GitHub Activity Contest

The website features a real-time GitHub activity contest that tracks contributions from team members.

### How It Works

1. **Data Fetching**
   - Pulls recent events from GitHub Events API
   - Fetches detailed commit stats from GitHub Commits API
   - Updates on page load and when switching users

2. **Scoring Algorithm**
   ```javascript
   Score = (0.6 × normalized_commits) + (0.4 × normalized_lines)

   Where:
   - normalized_commits = min(commits / 100, 1)
   - normalized_lines = min(lines_changed / 10000, 1)
   - Final score = rounded(formula × 1000)
   ```

3. **Features**
   - Live comparison between users
   - Commit feed with additions/deletions
   - User profile cards with GitHub stats
   - Winner gets highlighted with golden gradient
   - Collapsible section to save space

### Adding Users

Edit `app/index.html`:

```html
<div id="github-users-tabs">
  <button class="github-tab active" data-user="username1">username1</button>
  <button class="github-tab" data-user="username2">username2</button>
  <!-- Add more users here -->
</div>
```

Update contest data initialization in `app/js/index.js`:

```javascript
let contestData = {
  username1: { commits: 0, linesChanged: 0, score: 0 },
  username2: { commits: 0, linesChanged: 0, score: 0 }
};
```

---

## 🤝 Contributing

We welcome contributions from the community!

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
   - Add events to `app/js/data.js`
   - Update styles in `app/css/index.css`
   - Modify infrastructure in `lib/website-stack.ts`
4. **Test locally**
5. **Format code**
   ```bash
   npm run fix
   ```
6. **Commit your changes**
   ```bash
   git commit -m "✨ Add amazing feature"
   ```
7. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```
8. **Open a Pull Request**

### Areas We Need Help

- 🎨 **Design** - UI/UX improvements
- 📝 **Content** - Event descriptions and documentation
- ⚙️ **Infrastructure** - AWS optimizations
- 🧪 **Testing** - Additional test coverage
- 🐛 **Bug Fixes** - Report or fix issues

Join our [Discord](https://discord.gg/pWCgySrJ7A) to discuss contributions!

---

## 📄 License

This project is open source and available under the MIT License.

---

## 🔗 Links

- **Website:** [wmaug.org](https://wmaug.org)
- **Meetup:** [West Michigan AWS Users Group](https://www.meetup.com/west-michigan-aws-users-group)
- **Discord:** [Join our community](https://discord.gg/pWCgySrJ7A)
- **GitHub:** [@West-Michigan-AWS-Users-Group](https://github.com/West-Michigan-AWS-Users-Group)

---

## 🙏 Acknowledgments

- **Contributors:** [@tnielsen2](https://github.com/tnielsen2), [@wheeleruniverse](https://github.com/wheeleruniverse)
- **Sponsors:** Thank you to all our amazing sponsors!
- **Community:** Thanks to all WMAUG members for their support

---

<div align="center">
  <p>Built with ❤️ by the West Michigan AWS User Group</p>
  <p>Powered by AWS CDK • CloudFront • S3</p>
</div>
