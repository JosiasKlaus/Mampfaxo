import { WorkSheet, ColInfo } from 'xlsx/types';

export function autoFitColumns(worksheet: WorkSheet): void {
    const [firstCol, lastCol] = (worksheet['!ref'] || '').replace(/\d/, '').split(':');

    const numRegexp = new RegExp(/\d+$/g)

    const firstColIndex = firstCol.charCodeAt(0),
        lastColIndex = lastCol.charCodeAt(0),
        rows = +(numRegexp.exec(lastCol)?.[0] || 0);

    const objectMaxLength: ColInfo[] = []

    for (let colIndex = firstColIndex; colIndex <= lastColIndex; colIndex++) {
        const col = String.fromCharCode(colIndex)
        let maxCellLength = 0

        for (let row = 1; row <= rows; row++) {
            const cellLength = worksheet[`${col}${row}`].v.length + 1
            if (cellLength > maxCellLength) maxCellLength = cellLength
        }

        objectMaxLength.push({ width: maxCellLength })
    }
    worksheet['!cols'] = objectMaxLength
}

export default autoFitColumns;