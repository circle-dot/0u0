import { NextApiHandler } from 'next';
import fs from 'fs';
import path from 'path';
import { URL } from 'url';
import axios from 'axios';
import { JSDOM } from 'jsdom';

async function postRow(discourseUrl: string, postJson: any): Promise<string> {
    let avatarUrl = postJson.avatar_template;
    const parsedUrl = new URL(avatarUrl, discourseUrl);

    // Templates for the webpages
    // const base_scheme = new URL(discourseUrl)    

    const avatarPath = parsedUrl.pathname;
    const avatarFileName = path.basename(avatarPath);


    if (parsedUrl.host && parsedUrl.protocol) {
        // Do nothing
    } else if (parsedUrl.host) {
        avatarUrl = `${base_scheme}:${avatarUrl}`;
    } else {
        avatarUrl = `${discourseUrl}${avatarUrl}`;
    }
    avatarUrl = avatarUrl.replace('{size}', '45');

    if (!fs.existsSync(path.join(process.cwd(), 'images', avatarFileName))) {
        try {
            const response = await axios.get(avatarUrl, { responseType: 'arraybuffer' });
            fs.writeFileSync(path.join(process.cwd(), 'images', avatarFileName), response.data);
        } catch (err) {
            console.error('in post_row error:', 'write avatar', avatarUrl, err.message, cnt, topic.slug, "\n===========\n");
        }
    }

    const userName = postJson.username;
    let content = postJson.cooked;

    // Replace any anchors of class mention with a span
    const dom = new JSDOM(content);
    const { window: { document } } = dom;
    const mentionTags = document.querySelectorAll('a.mention');
    for (const tag of mentionTags) {
        try {
            const rep = document.createElement('span');
            rep.className = 'mention';
            rep.textContent = tag.textContent;
            tag.replaceWith(rep);
        } catch (err) {
            // Do nothing
        }
    }

    const imgTags = document.querySelectorAll('img');
    for (const imgTag of imgTags) {
        let imgUrl = imgTag.getAttribute('src')!;
        const parsedImgUrl = new URL(imgUrl, discourseUrl);
        const imgPath = parsedImgUrl.pathname;
        const fileName = path.basename(imgPath);

        if (parsedImgUrl.host && parsedImgUrl.protocol) {
            // Do nothing
        } else if (parsedImgUrl.host) {
            imgUrl = `${base_scheme}:${imgUrl}`;
        } else {
            imgUrl = `${discourseUrl}${imgUrl}`;
        }

        try {
            const response = await axios.get(imgUrl, { responseType: 'arraybuffer' });
            fs.writeFileSync(path.join(process.cwd(), 'images', fileName), response.data);
            imgTag.setAttribute('src', `../../../images/${fileName}`);
        } catch (err) {
            console.error('post_row', 'save image', fileName, imgUrl, err.message);
            imgTag.setAttribute('src', '../../../images/missing_image.png');
        }
    }

    content = '';
    for (const s of Array.from(document.body.childNodes)) {
        content += s.outerHTML;
    }

    let postString = '      <div class="post_container">\n';
    postString += '        <div class="avatar_container">\n';
    postString += `          <img src="../../../images/${avatarFileName}" class="avatar" />\n`;
    postString += '        </div>\n';
    postString += '        <div class="post">\n';
    postString += `          <div class="user_name">${userName}</div>\n`;
    postString += '          <div class="post_content">\n';
    postString += content + '\n';
    postString += '          </div>\
  
    return postString;
}

export default postRow;