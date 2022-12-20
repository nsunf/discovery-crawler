import puppeteer from "puppeteer";
import * as cheerio from "cheerio";

const new_men_url = "https://www.discovery-expedition.com/display/view?currentCtgryDpthCd=2&dspCtgryNo=DXMA01A01&ctgrySectCd=GNRL_CTGRY&ctgryNoDpth1=DXMA01&ctgryNoDpth2=DXMA01A01&prcStart=0&prcEnd=100&sortColumn=NEW_GOD_SEQ&pageSize=120&pageNo=";
const new_women_url = "https://www.discovery-expedition.com/display/view?currentCtgryDpthCd=2&dspCtgryNo=DXMA02A01&ctgrySectCd=GNRL_CTGRY&ctgryNoDpth1=DXMA02&ctgryNoDpth2=DXMA02A01&prcStart=0&prcEnd=100&sortColumn=NEW_GOD_SEQ&pageSize=120&pageNo=";

(async () => {
  const browser = await puppeteer.launch({headless: true});
  const page = await browser.newPage();
  let $: cheerio.CheerioAPI;

  for (let i = 1; i < 2; i++) {
    await page.goto(new_men_url + i);
    $ = cheerio.load(await page.content());
    $("#contents > div.contents-type01-box02 > div.item-list02 > ul > li").each((n, e) => {
      const name = $(e).find(".item-info > p:first-child > a").text().trim();
      const price = $(e).find(".item-info > p:nth-child(2)").text().trim();

      console.log(n + ". " + name + " : " + price);
    })
  }

  browser.close();
})();
