const fs = require('fs');
const path = require('path');

const imagePath = String.raw`D:\My Websites\CodeReapers\Code-Reapers\Shared\SampleFloorPlans\dummy university\University Hall_0\University Hall_0-1_ocr_result.png`;

console.log('Testing file access for:', imagePath);

try {
    if (fs.existsSync(imagePath)) {
        console.log('File exists.');
        const stats = fs.statSync(imagePath);
        console.log('Size:', stats.size);

        console.log('Reading file...');
        const buffer = fs.readFileSync(imagePath);
        console.log('Read success. Buffer length:', buffer.length);

        const base64 = buffer.toString('base64');
        console.log('Base64 length:', base64.length);
    } else {
        console.error('File does not exist!');
    }
} catch (e) {
    console.error('Error:', e);
}
