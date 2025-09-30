import { newsFeedEntries, sponsors } from './data.js';

let currentGithubUser = 'tnielsen2';
let contestData = {
  tnielsen2: { commits: 0, linesChanged: 0, score: 0 },
  wheeleruniverse: { commits: 0, linesChanged: 0, score: 0 }
};

function onScroll() {
  const scrollCtrl = document.getElementById('scroll-ctrl');
  scrollCtrl.style.display =
      document.body.scrollTop > 20 || document.documentElement.scrollTop > 20
          ? 'block' : 'none';
}

function scrollToTop() {
  window.scrollTo({
    behavior: 'smooth', top: 0
  });
}

function populateNewsFeed() {
  const newsfeed = document.getElementById('newsfeed');
  const newsfeedPast = document.getElementById('newsfeed-past');

  newsFeedEntries.forEach((entry) => {
    const imageElement = document.createElement('img');
    imageElement.classList.add('banner');
    imageElement.alt = entry.imageAlt;
    imageElement.src = entry.imageSrc;

    const titleElement = document.createElement('span');
    titleElement.classList.add('title');
    titleElement.textContent = entry.title;

    const subtitleElement = document.createElement('span');
    subtitleElement.classList.add('subtitle');
    subtitleElement.textContent = entry.subtitle;

    const detailsElement = document.createElement('div');
    detailsElement.appendChild(titleElement);
    detailsElement.appendChild(subtitleElement);
    detailsElement.classList.add('entry-details');

    const anchorElement = document.createElement('a');
    anchorElement.appendChild(imageElement);
    anchorElement.appendChild(detailsElement);
    anchorElement.classList.add('newsfeed-entry');
    anchorElement.href = entry.link;
    anchorElement.target = '_blank';

    if(entry.isPast){
      newsfeedPast.appendChild(anchorElement);
    } else {
      newsfeed.appendChild(anchorElement);
    }
  });
}

function populateSponsors() {
  const sponsorsContainer = document.getElementById('sponsors-container');

  // Sort sponsors alphabetically by name
  const sortedSponsors = [...sponsors].sort((a, b) => a.name.localeCompare(b.name));

  sortedSponsors.forEach((sponsor) => {
    const logoElement = document.createElement('img');
    logoElement.classList.add('sponsor-logo');
    logoElement.alt = `${sponsor.name} Logo`;
    logoElement.src = sponsor.logo;

    const nameElement = document.createElement('p');
    nameElement.classList.add('sponsor-name');
    nameElement.textContent = sponsor.name;

    const sponsorElement = document.createElement('a');
    sponsorElement.appendChild(logoElement);
    sponsorElement.appendChild(nameElement);
    sponsorElement.classList.add('sponsor');
    sponsorElement.href = sponsor.website;
    sponsorElement.target = '_blank';

    sponsorsContainer.appendChild(sponsorElement);
  });
}

async function fetchGitHubCommits(username) {
  try {
    // Fetch user's events (includes commits)
    const response = await fetch(`https://api.github.com/users/${username}/events/public?per_page=100`);
    if (!response.ok) throw new Error('Failed to fetch commits');

    const events = await response.json();

    // Filter for push events and extract commits
    const commits = [];
    let totalLinesChanged = 0;

    events.forEach(event => {
      if (event.type === 'PushEvent' && event.payload.commits) {
        event.payload.commits.forEach(commit => {
          // Estimate lines changed (GitHub API doesn't provide this in events)
          // We'll fetch detailed commit info for accuracy
          commits.push({
            message: commit.message,
            sha: commit.sha.substring(0, 7),
            fullSha: commit.sha,
            repo: event.repo.name,
            repoUrl: `https://github.com/${event.repo.name}`,
            commitUrl: `https://github.com/${event.repo.name}/commit/${commit.sha}`,
            date: new Date(event.created_at),
            author: commit.author.name
          });
        });
      }
    });

    // Sort by date (most recent first)
    const sortedCommits = commits.sort((a, b) => b.date - a.date);

    // Fetch detailed stats for commits (limit to avoid rate limiting)
    const detailedCommits = await Promise.all(
      sortedCommits.slice(0, 15).map(async (commit) => {
        try {
          const detailResponse = await fetch(`https://api.github.com/repos/${commit.repo}/commits/${commit.fullSha}`);
          if (detailResponse.ok) {
            const detail = await detailResponse.json();
            const additions = detail.stats?.additions || 0;
            const deletions = detail.stats?.deletions || 0;
            totalLinesChanged += additions + deletions;
            return { ...commit, additions, deletions, linesChanged: additions + deletions };
          }
        } catch (err) {
          console.warn('Could not fetch commit details:', err);
        }
        return { ...commit, additions: 0, deletions: 0, linesChanged: 0 };
      })
    );

    // Update contest data
    contestData[username].commits = sortedCommits.length;
    contestData[username].linesChanged = totalLinesChanged;

    return detailedCommits;
  } catch (error) {
    console.error('Error fetching GitHub commits:', error);
    return [];
  }
}

async function fetchGitHubContributions(username) {
  try {
    // Fetch user info for contribution data
    const response = await fetch(`https://api.github.com/users/${username}`);
    if (!response.ok) throw new Error('Failed to fetch user data');

    const userData = await response.json();
    return {
      publicRepos: userData.public_repos,
      followers: userData.followers,
      following: userData.following,
      profileUrl: userData.html_url,
      avatarUrl: userData.avatar_url,
      bio: userData.bio,
      name: userData.name || username
    };
  } catch (error) {
    console.error('Error fetching GitHub user data:', error);
    return null;
  }
}

function renderGitHubChart(userData) {
  const chartContainer = document.getElementById('github-chart-container');
  chartContainer.innerHTML = '';

  if (!userData) return;

  const chartCard = document.createElement('div');
  chartCard.classList.add('github-chart-card');

  const avatar = document.createElement('img');
  avatar.classList.add('github-avatar');
  avatar.src = userData.avatarUrl;
  avatar.alt = userData.name;

  const userInfo = document.createElement('div');
  userInfo.classList.add('github-user-info');

  const userName = document.createElement('h3');
  userName.textContent = userData.name;

  const userBio = document.createElement('p');
  userBio.classList.add('github-bio');
  userBio.textContent = userData.bio || 'No bio available';

  const statsContainer = document.createElement('div');
  statsContainer.classList.add('github-stats');

  const reposStat = document.createElement('div');
  reposStat.classList.add('github-stat');
  reposStat.innerHTML = `<span class="stat-value">${userData.publicRepos}</span><span class="stat-label">Repos</span>`;

  const followersStat = document.createElement('div');
  followersStat.classList.add('github-stat');
  followersStat.innerHTML = `<span class="stat-value">${userData.followers}</span><span class="stat-label">Followers</span>`;

  const followingStat = document.createElement('div');
  followingStat.classList.add('github-stat');
  followingStat.innerHTML = `<span class="stat-value">${userData.following}</span><span class="stat-label">Following</span>`;

  statsContainer.appendChild(reposStat);
  statsContainer.appendChild(followersStat);
  statsContainer.appendChild(followingStat);

  userInfo.appendChild(userName);
  userInfo.appendChild(userBio);
  userInfo.appendChild(statsContainer);

  chartCard.appendChild(avatar);
  chartCard.appendChild(userInfo);

  const profileLink = document.createElement('a');
  profileLink.href = userData.profileUrl;
  profileLink.target = '_blank';
  profileLink.classList.add('github-profile-link');
  profileLink.appendChild(chartCard);

  chartContainer.appendChild(profileLink);
}

function calculateContestScore(commits, linesChanged) {
  // Normalization formula: Score = (0.6 * normalized_commits) + (0.4 * normalized_lines)
  // This gives more weight to commits but still values lines changed
  const maxCommits = 100;
  const maxLines = 10000;

  const normalizedCommits = Math.min(commits / maxCommits, 1);
  const normalizedLines = Math.min(linesChanged / maxLines, 1);

  return Math.round((0.6 * normalizedCommits + 0.4 * normalizedLines) * 1000);
}

function renderContestScoreboard() {
  const scoreboardContainer = document.getElementById('contest-scoreboard');
  scoreboardContainer.innerHTML = '';

  // Calculate scores
  contestData.tnielsen2.score = calculateContestScore(
    contestData.tnielsen2.commits,
    contestData.tnielsen2.linesChanged
  );
  contestData.wheeleruniverse.score = calculateContestScore(
    contestData.wheeleruniverse.commits,
    contestData.wheeleruniverse.linesChanged
  );

  const scoreboard = document.createElement('div');
  scoreboard.classList.add('scoreboard');

  // User 1 card
  const user1Card = createContestCard('tnielsen2', contestData.tnielsen2);

  // VS divider
  const vsDivider = document.createElement('div');
  vsDivider.classList.add('vs-divider');
  vsDivider.textContent = 'VS';

  // User 2 card
  const user2Card = createContestCard('wheeleruniverse', contestData.wheeleruniverse);

  scoreboard.appendChild(user1Card);
  scoreboard.appendChild(vsDivider);
  scoreboard.appendChild(user2Card);

  scoreboardContainer.appendChild(scoreboard);
}

function createContestCard(username, data) {
  const card = document.createElement('div');
  card.classList.add('contest-card');

  // Determine if winner
  const isWinner = data.score > contestData[username === 'tnielsen2' ? 'wheeleruniverse' : 'tnielsen2'].score;
  if (isWinner && data.score > 0) {
    card.classList.add('winner');
  }

  const usernameEl = document.createElement('h4');
  usernameEl.classList.add('contest-username');
  usernameEl.textContent = username;

  const scoreEl = document.createElement('div');
  scoreEl.classList.add('contest-score');
  scoreEl.textContent = data.score;

  const statsEl = document.createElement('div');
  statsEl.classList.add('contest-stats');
  statsEl.innerHTML = `
    <div class="contest-stat">
      <span class="contest-stat-value">${data.commits}</span>
      <span class="contest-stat-label">Commits</span>
    </div>
    <div class="contest-stat">
      <span class="contest-stat-value">${data.linesChanged.toLocaleString()}</span>
      <span class="contest-stat-label">Lines Changed</span>
    </div>
  `;

  card.appendChild(usernameEl);
  card.appendChild(scoreEl);
  card.appendChild(statsEl);

  return card;
}

function renderGitHubCommits(commits) {
  const commitsContainer = document.getElementById('github-commits-container');
  commitsContainer.innerHTML = '';

  if (commits.length === 0) {
    const noCommits = document.createElement('p');
    noCommits.classList.add('no-commits');
    noCommits.textContent = 'No recent commits found';
    commitsContainer.appendChild(noCommits);
    return;
  }

  commits.forEach(commit => {
    const commitCard = document.createElement('a');
    commitCard.classList.add('commit-card');
    commitCard.href = commit.commitUrl;
    commitCard.target = '_blank';

    const commitHeader = document.createElement('div');
    commitHeader.classList.add('commit-header');

    const commitRepo = document.createElement('span');
    commitRepo.classList.add('commit-repo');
    commitRepo.textContent = commit.repo;

    const commitSha = document.createElement('span');
    commitSha.classList.add('commit-sha');
    commitSha.textContent = commit.sha;

    commitHeader.appendChild(commitRepo);
    commitHeader.appendChild(commitSha);

    const commitMessage = document.createElement('p');
    commitMessage.classList.add('commit-message');
    commitMessage.textContent = commit.message.split('\n')[0]; // First line only

    const commitStats = document.createElement('div');
    commitStats.classList.add('commit-stats');

    if (commit.linesChanged > 0) {
      const additions = document.createElement('span');
      additions.classList.add('commit-additions');
      additions.textContent = `+${commit.additions}`;

      const deletions = document.createElement('span');
      deletions.classList.add('commit-deletions');
      deletions.textContent = `-${commit.deletions}`;

      commitStats.appendChild(additions);
      commitStats.appendChild(deletions);
    }

    const commitDate = document.createElement('span');
    commitDate.classList.add('commit-date');
    commitDate.textContent = formatDate(commit.date);

    commitCard.appendChild(commitHeader);
    commitCard.appendChild(commitMessage);
    commitCard.appendChild(commitStats);
    commitCard.appendChild(commitDate);

    commitsContainer.appendChild(commitCard);
  });
}

function formatDate(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

async function loadGitHubData(username) {
  currentGithubUser = username;

  // Show loading state
  const commitsContainer = document.getElementById('github-commits-container');
  const chartContainer = document.getElementById('github-chart-container');
  commitsContainer.innerHTML = '<p class="loading">Loading commits...</p>';
  chartContainer.innerHTML = '<p class="loading">Loading profile...</p>';

  // Fetch data
  const [commits, userData] = await Promise.all([
    fetchGitHubCommits(username),
    fetchGitHubContributions(username)
  ]);

  // Render results
  renderGitHubChart(userData);
  renderGitHubCommits(commits);
  renderContestScoreboard();
}

async function loadAllContestData() {
  // Load data for both users to populate contest
  await Promise.all([
    fetchGitHubCommits('tnielsen2'),
    fetchGitHubCommits('wheeleruniverse')
  ]);

  renderContestScoreboard();
}

function setupGitHubTabs() {
  const tabs = document.querySelectorAll('.github-tab');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Update active state
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Load data for selected user
      const username = tab.getAttribute('data-user');
      loadGitHubData(username);
    });
  });
}

function setupToggleButton() {
  const toggleButton = document.getElementById('toggle-github-section');
  const sectionContent = document.getElementById('github-section-content');

  toggleButton.addEventListener('click', () => {
    const isCollapsed = sectionContent.classList.toggle('collapsed');
    const icon = toggleButton.querySelector('i');

    if (isCollapsed) {
      icon.classList.remove('fa-chevron-up');
      icon.classList.add('fa-chevron-down');
    } else {
      icon.classList.remove('fa-chevron-down');
      icon.classList.add('fa-chevron-up');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  populateNewsFeed();
  populateSponsors();
  setupGitHubTabs();
  setupToggleButton();
  loadAllContestData(); // Load both users for contest
  loadGitHubData('tnielsen2'); // Load default user details
});

window.onscroll = onScroll;

document
.getElementById('scroll-ctrl')
.addEventListener('click', scrollToTop);
