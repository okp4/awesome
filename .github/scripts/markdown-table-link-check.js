const fs = require("fs");
const linkCheck = require("link-check");
const LinkCheckResult = require("link-check").LinkCheckResult;
const readmeContent = fs.readFileSync("./README.md", "utf8");
const { parseMarkdownTables } = require("./helper/index.js");
const opt = require("./.link-check.json");
const { resolve } = require("dns");

const replacementSymbolDead = "❌";
const replacementSymbolAlive = "✅";
const parsedTable = parseMarkdownTables(readmeContent);
const allLinksFromUrlsClm = parsedTable
    .map((table) => table.url)
    .flat()
    .filter(Boolean);

async function linksCheck(links) {
    const linkCheckResults = [];
    for (const link of links) {
        const res = await new Promise((resolve) =>
            linkCheck(link, opt, (err, result) => {
                if (err) {
                    console.warn(err);
                    return resolve({
                        link,
                        status: "dead",
                    });
                }
                return resolve(result);
            })
        );
        linkCheckResults.push(res);
    }
    return linkCheckResults;
}

async function checkLinksInTables() {
    const results = await linksCheck(allLinksFromUrlsClm);
    return results.reduce(
        (acc, cur) => {
            if (cur.status === "dead") {
                acc.arrDead.push(cur.link);
            }
            if (cur.status === "alive") {
                acc.arrAlive.push(cur.link);
            }
            return acc;
        },
        { arrDead: [], arrAlive: [] }
    );
}

async function updateLinks(arrDead, arrAlive, lines) {
    const updatedLines = lines.map((line) => {
        arrDead.forEach((link) => {
            if (line.includes(link)) {
                line = line.replace(
                    replacementSymbolAlive,
                    replacementSymbolDead
                );
            }
        });
        arrAlive.forEach((link) => {
            if (line.includes(link)) {
                line = line.replace(
                    replacementSymbolDead,
                    replacementSymbolAlive
                );
            }
        });
        return line;
    });
    return updatedLines;
}

(async function () {
    const { arrAlive, arrDead } = await checkLinksInTables();
    const lines = readmeContent.split("\n");

    const updatedLines = await updateLinks(arrDead, arrAlive, lines);
    const updatedTable = updatedLines.join("\n");
    fs.writeFileSync("./README.md", updatedTable, "utf8");
})();
