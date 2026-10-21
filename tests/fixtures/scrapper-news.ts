
//helper
export function createRow(
    rank: number,
    title = `Story ${rank}`,
    metadata  = '<span class="score">12 points</span><a>3 comments</a>',
  ): string {
    return `
       <tr class="athing">
        <td><span class="rank">${rank}.</span></td>
        <td>
          <span class="titleline">
            <a href="https://example.com">${title}</a>
          </span>
        </td>
      </tr>
      <tr>
        <td></td>
        <td class="subtext">${metadata}</td>
      </tr>
      `;
  }
  
  //helper
  export function createPage(firstRow = createRow(1), count = 30): string {
      const remainingRows = Array.from(
        { length: count - 1 },
        (_, index) => createRow(index + 2),
      ).join("");
    
      return `<table>${firstRow}${remainingRows}</table>`;
    }