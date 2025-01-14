const fs = require("fs");
const pdfParse = require("pdf-parse");
const { OpenAI } = require("openai");
const path = require("path");
const Tesseract = require("tesseract.js");
const { createCanvas } = require("canvas");

/**
 * Splits text into manageable chunks.
 * @param {string} text - The input text to split.
 * @param {number} maxTokens - Maximum tokens per chunk (default: 4000).
 * @returns {string[]} - Array of text chunks.
 */
function splitTextIntoChunks(text, maxTokens = 4000) {
  const chunks = [];
  const sentences = text.split(/\.\s+/); // Split by sentence.
  let chunk = "";

  for (const sentence of sentences) {
    if ((chunk + sentence).length > maxTokens) {
      chunks.push(chunk.trim());
      chunk = sentence;
    } else {
      chunk += `${sentence}. `;
    }
  }
  if (chunk) chunks.push(chunk.trim()); // Push the remaining text.
  return chunks;
}

/**
 * Extract text from a PDF file.
 * @param {string} filePath - Path to the PDF file.
 * @returns {Promise<string>} - Extracted text from the PDF.
 */
async function extractTextFromPDF(filePath) {
  const dataBuffer = fs.readFileSync(filePath);

  try {
    // Attempt to extract text using pdf-parse (for text-based PDFs)
    const pdfData = await pdfParse(dataBuffer);
    if (pdfData.text.trim()) {
      console.log("Extracted text using pdf-parse.");
      return pdfData.text;
    }
  } catch (error) {
    console.warn("pdf-parse failed. Trying OCR...");
  }

  // Use OCR for image-based PDFs
  // console.log("Starting OCR with Tesseract...");
  // const pdfjs = require("pdfjs-dist");

  // const pdfDoc = await pdfjs.getDocument({ data: dataBuffer }).promise;
  // const numPages = pdfDoc.numPages;

  // const ocrPromises = [];

  // for (let i = 1; i <= numPages; i++) {
  //   const page = await pdfDoc.getPage(i);
  //   const viewport = page.getViewport({ scale: 1.0 });

  //   // Render the page to an image
  //   const canvas = createCanvas(viewport.width, viewport.height);
  //   const context = canvas.getContext("2d");
  //   await page.render({ canvasContext: context, viewport }).promise;

  //   // Convert the image to a Base64 data URL for OCR
  //   const imageData = canvas.toDataURL();

  //   // Perform OCR on the page image
  //   ocrPromises.push(
  //     Tesseract.recognize(imageData, "eng").then((result) => {
  //       console.log(`OCR completed for page ${i}`);
  //       return result.data.text;
  //     })
  //   );
  // }

  // // Combine OCR results from all pages
  // const ocrResults = await Promise.all(ocrPromises);
  // console.log("OCR completed for all pages.");
  // return ocrResults.join("\n");
}

/**
 * Process contract data using OpenAI API.
 * @param {string} text - Extracted text from the contract.
 * @returns {Promise<Object>} - Extracted contract details.
 */
async function extractContractDetails(text) {
  const prompt = `
    The following text is a contract. Extract the following details:
    - Execution Date
    - Effective Date
    - Termination Date
    - Parties Involved
    - Title of the Contract
    - Description of the Contract
    - Renewal Time (if mentioned)

    Contract Text:
    "${text}"

    Provide the details in JSON format. If any field is not found, use null for its value.
    `;

  const openai = new OpenAI({
    apiKey: process.env.OPENAI,
  });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
    });

    const completion = response.choices[0].message.content;

    try {
      return JSON.parse(completion);
    } catch (parseError) {
      throw new Error("Failed to parse OpenAI response as JSON.");
    }
  } catch (error) {
    throw new Error(`Failed to process contract details: ${error.message}`);
  }
}

/**
 * Main function to process a contract file.
 * @param {string} relativeFilePath - Relative path to the contract file.
 */
async function processContract(relativeFilePath) {
  try {
    const filePath = path.resolve(__dirname, relativeFilePath);

    console.log("Checking if the file exists...");
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at: ${filePath}`);
    }

    console.log("Extracting text from the contract...");
    const text = await extractTextFromPDF(filePath);

    if (!text || text.trim() === "") {
      throw new Error("No text extracted from the PDF. Ensure the PDF is not image-based.");
    }

    console.log("Splitting text into manageable chunks...");
    const chunks = splitTextIntoChunks(text, 4000);

    console.log(`Processing ${chunks.length} chunk(s)...`);
    const results = [];
    for (const [index, chunk] of chunks.entries()) {
      console.log(`Processing chunk ${index + 1} of ${chunks.length}...`);
      const chunkDetails = await extractContractDetails(chunk);
      results.push(chunkDetails);
    }

    console.log("Combining results from all chunks...");
    const combinedResults = {
      ExecutionDate: null,
      EffectiveDate: null,
      TerminationDate: null,
      PartiesInvolved: new Set(), 
      TitleOfContract: null,
      DescriptionOfContract: "",
      RenewalTime: null,
    };

    console.log(results);

    results.forEach((result, index) => {
      console.log(`Processing Chunk ${index + 1}`);
    
      // Merge Execution Date: Use the first non-null value
      if (!combinedResults.ExecutionDate && result['Execution Date']) {
        combinedResults.ExecutionDate = result['Execution Date'];
      }
    
      // Merge Effective Date: Use the first non-null value
      if (!combinedResults.EffectiveDate && result['Effective Date']) {
        combinedResults.EffectiveDate = result['Effective Date'];
      }
    
      // Merge Termination Date: Use the first non-null value
      if (!combinedResults.TerminationDate && result['Termination Date']) {
        combinedResults.TerminationDate = result['Termination Date'];
      }
    
      // Merge Renewal Time: Use the first non-null value
      if (!combinedResults.RenewalTime && result['Renewal Time']) {
        combinedResults.RenewalTime = result['Renewal Time'];
      }
    
      // Merge Title of Contract: Use the first non-null value
      if (!combinedResults.TitleOfContract && result['Title of the Contract']) {
        combinedResults.TitleOfContract = result['Title of the Contract'];
      }
    
      // Merge Parties Involved: Add all unique values to the Set
      if (result['Parties Involved']) {
        result['Parties Involved'].forEach((party) =>
          combinedResults.PartiesInvolved.add(party)
        );
      }
    
      // Merge Descriptions: Concatenate all descriptions
      if (result['Description of the Contract']) {
        combinedResults.DescriptionOfContract += ` ${result['Description of the Contract']}`;
      }
    });
    
    // Convert PartiesInvolved Set to an Array
    combinedResults.PartiesInvolved = Array.from(combinedResults.PartiesInvolved);
    
    // Trim and clean up the final description
    combinedResults.DescriptionOfContract = combinedResults.DescriptionOfContract.trim();

    console.log("Final Combined Contract Details:");
    console.log(JSON.stringify(combinedResults, null, 2));

    return combinedResults;
  } catch (error) {
    console.error("Error processing the contract:", error.message);
  }
}

// Example usage
// const filePath = "./sample.pdf";
// processContract(filePath);


module.exports = {
  processContract,
};

