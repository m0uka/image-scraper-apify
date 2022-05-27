# Image Scraper

A simple scraper that scrapes all images from a website, archives them to a zip file, and then pushes a download link to the dataset.

## Use Cases

You can use this scraper in order to download images from a certain website - useful for tracking blog posts, new posts, etc..

## Input

The actor only needs to know which websites to get images from, and which proxies to use.
You can specify multiple websites to get multiple results on one run.

## Results

The actor stores its result in the default dataset associated with the actor run. It can be then exported to various formats, such as JSON, XML, CSV or Excel.

Each website in the dataset will contain a seperate object that follows this format (JSON is used below):

```json
{
  "url": "https://apify.com",
  "urlHash": "d0734ca443cdd7bb52b219011c750508",
  "download": "https://api.apify.com/v2/key-value-stores/e4QDEvYo5hNPCZeJr/records/d0734ca443cdd7bb52b219011c750508.zip"
}
```