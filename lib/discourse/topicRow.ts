import axios from 'axios';

async function topicRow(discourseUrl, topicJson: any): Promise<string> {
  const categoryUrl = `${discourseUrl}/categories.json`;
  const response = await axios.get(categoryUrl);
  const categories = response.data.category_list.categories;
  const categoryIdToName = Object.fromEntries(categories.map((cat: any) => [cat.id, cat.name]));

  let topicHtml = '';
  const topicUrl = `${topicJson.slug}/${topicJson.id}`;
  const topicTitleText = topicJson.fancy_title;
  const topicPostCount = topicJson.posts_count;

  topicHtml += `
    Category: ${categoryIdToName}
    Topic Url: ${topicUrl}
    Title: ${topicTitleText}
    Post count: ${topicPostCount}
  `;

  return topicHtml;
}

export default topicRow;
