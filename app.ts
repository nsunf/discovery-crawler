import puppeteer from "puppeteer";
import * as cheerio from "cheerio";
import * as fs from "fs";
import axios from "axios";

const pageSize: 40|80|120 = 40;
const numOfPages = 1;

const url = "https://www.discovery-expedition.com/";
const new_men_url = url + "display/view?currentCtgryDpthCd=2&dspCtgryNo=DXMA01A01&ctgrySectCd=GNRL_CTGRY&ctgryNoDpth1=DXMA01&ctgryNoDpth2=DXMA01A01&prcStart=0&prcEnd=100&sortColumn=NEW_GOD_SEQ";
const new_women_url = url + "display/view?currentCtgryDpthCd=2&dspCtgryNo=DXMA02A01&ctgrySectCd=GNRL_CTGRY&ctgryNoDpth1=DXMA02&ctgryNoDpth2=DXMA02A01&prcStart=0&prcEnd=100&sortColumn=NEW_GOD_SEQ";

interface Product {
  id: String;
  name: String;
  price: number;
  sizes: number[];
  images: string[];
  descriptions: string[];
  longImages: string[];
}

async function getProductsToJSON() {
  mkdir("data");
  const products: Product[] = [];

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  let $: cheerio.CheerioAPI;

  for (let p = 0; p < numOfPages; p++) {
    await page.goto(new_men_url + `&pageSize=${pageSize}&pageNo=${p + 1}`);

    $ = cheerio.load(await page.content());

    const pathList: string[] = [];

    $("#contents > div.contents-type01-box02 > div.item-list02 > ul > li > a").each((_, el) => {
      const onclickStr = $(el).attr("onclick") ?? "";
      let startIdx = "gaTagging('".length;
      let endIdx = onclickStr.indexOf("','");

      const path = onclickStr.slice(startIdx, endIdx);
      pathList.push(path);
    })

    for (let i = 0; i < pathList.length; i++) {
      await page.goto(url + pathList[i]);
      $ = cheerio.load(await page.content());
      const p_name = $(".payment-name").text().trim();
      const p_price = $(".payment-price .price .txt-price em").text().trim();
      const p_code = $(".dl-dfn .dl-txt").text().trim();
      const p_sizes = $(".payment-option-size > button").map((_, el) => $(el).text().trim()).toArray();
      const p_imgs = $("div.slide-container > ul.slide-wrapper li.pic > a.item > img").map((_, el) => $(el).attr("src")).toArray();
      const p_desc = $("div.product-img-wrap div.product-img-info > ul > ul > li").map((_, el) => $(el).text().trim()).toArray();
      const p_longImgs = $("div.product-img-wrap div.product-img-info > ul > div > img").map((_, el) => $(el).attr("src")).toArray();

      products.push({
        id: p_code,
        name: p_name,
        price: parseInt(p_price.replace(",", "")),
        sizes: p_sizes.map(v => parseInt(v)),
        images: p_imgs,
        descriptions: p_desc, 
        longImages: p_longImgs
      })
      console.log(`progress : (${(p * pageSize) + (i + 1)} / ${numOfPages * pageSize})`);
    }
  }

  fs.writeFileSync("./data/products.json", JSON.stringify(products, null, 2));
  console.log(products.length + " files saved");

  browser.close();
}

async function extracImagesFromJSON() {
  deleteImagesDir();
  mkdir("images");
  const jsonData = fs.readFileSync("./data/products.json", "utf-8");
  const products: Product[] = JSON.parse(jsonData);

  const total = products.map(p => p.images.length + p.longImages.length).reduce((prev, curr) => prev + curr);
  let count = 0;

  for (let p of products) {
    let idx = 1;
    for (let img of p.images) {
      await saveImage(img, `${p.id}_${idx}`);

      idx++;
      count++;
      console.log(`progress : (${count} / ${total})`);
    }

    idx = 1;
    for (let img of p.longImages) {
      await saveImage(img, `${p.id}_long_${idx}`);

      idx++;
      count++;
      console.log(`progress : (${count} / ${total})`);
    }
  }
  console.log("complete");
}

function mkdir(name: String) {
  const path = "./" + name;
  if (!fs.existsSync(path))
    fs.mkdirSync(path);
}

function deleteImagesDir() {
  if (fs.existsSync("./images"))
    fs.rmSync("./images", { recursive: true });
}

async function saveImage(imgUrl: string, filename: string) {
  let ext = "";
  if (imgUrl.includes(".jpg")) ext = ".jpg";
  else ext = ".png";

  const writer = fs.createWriteStream(`./images/${filename}${ext}`);
  const response = await axios({ url: imgUrl, method: 'GET', responseType: 'stream' })
  await response.data.pipe(writer);
}

// getProductsToJSON();
// extracImagesFromJSON();