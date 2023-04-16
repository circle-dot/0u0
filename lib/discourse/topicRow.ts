import { sleep } from "@/lib/utils"

async function topicRow(discourseUrl, topicJson: any, categoryIdToName): Promise<string> {
  const topicUrl = `${topicJson.slug}/${topicJson.id}`;
  const topicTitleText = topicJson.fancy_title;
  const topicPostCount = topicJson.posts_count;

  const topicHtml = `
    Category: ${categoryIdToName}
    Topic Url: ${topicUrl}
    Title: ${topicTitleText}
    Post count: ${topicPostCount}
  `;

  await sleep(500)
  return topicHtml;
}

export default topicRow;
