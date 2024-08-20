import { newsFeedEntries } from './data.js';

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

document.addEventListener('DOMContentLoaded', populateNewsFeed);

window.onscroll = onScroll;

document
.getElementById('scroll-ctrl')
.addEventListener('click', scrollToTop);
