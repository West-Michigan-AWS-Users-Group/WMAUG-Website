import { newsFeedEntries, sponsors } from './data.js';

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

document.addEventListener('DOMContentLoaded', () => {
  populateNewsFeed();
  populateSponsors();
});

window.onscroll = onScroll;

document
.getElementById('scroll-ctrl')
.addEventListener('click', scrollToTop);
