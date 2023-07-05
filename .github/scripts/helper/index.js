const cheerio = require('cheerio');
const MarkdownIt = require('markdown-it');
const md = new MarkdownIt();

function parseMarkdownTables(readmeContent) {
  const HTML = md.render(readmeContent);
  const collectedTables = [];
  const $ = cheerio.load(HTML);
  const partition = (array, n) => {
    return array.length ? [array.splice(0, n)].concat(partition(array, n)) : [];
  }
  $("table").each((index, element) => {
    const tableHeaders = [];
    const tableElement = $(element).clone();
    $(element).clone().find('th').each((i, element) => {
      tableHeaders.push(
        $(element)
          .text()
          .toLowerCase()
      );
    });
    const result = $(tableElement).find('td').map((i, element) => {
      return $(element).text()
    });
    const partitioned = partition(result.toArray(), tableHeaders.length);
    const parsedTable = tableHeaders.reduce((acc, cur, index) => {
      if (acc[cur]) {
        return acc;
      }
      acc[cur] = partitioned.map(part => part[index]);
      return acc;

    }, {})

    collectedTables.push(parsedTable)
  });

  return collectedTables;
}
module.exports = {
  parseMarkdownTables
}