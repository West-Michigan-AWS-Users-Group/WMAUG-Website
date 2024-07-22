
import {newsFeedEntries} from './data.js';

function populateNewsFeed() {

    const newsfeedElement = document.getElementById('newsfeed');

    newsFeedEntries.forEach(entry => {
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
        anchorElement.href = entry.link;
        anchorElement.target = '_blank';

        const containerElement = document.createElement('div');
        containerElement.appendChild(anchorElement);
        containerElement.classList.add('newsfeed-entry');

        newsfeedElement.appendChild(containerElement);
    });
}

document.addEventListener("DOMContentLoaded", function() {
    populateNewsFeed();
});
