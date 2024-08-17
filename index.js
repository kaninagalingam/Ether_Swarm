const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { Bee, BeeDebug } = require('@ethersphere/bee-js');

const app = express();
const port = 3000;

const bee = new Bee('http://localhost:1633');
const upload = multer({ dest: 'uploads/' });
app.use(express.json());


let POSTAGE_BATCH_ID = null;


async function generatePostageBatchId() {
  try {
    if (!POSTAGE_BATCH_ID) {
      const postageBatchId = await bee.createPostageBatch("414720000", 17);
      POSTAGE_BATCH_ID = postageBatchId;
      console.log("Generated new POSTAGE_BATCH_ID:", POSTAGE_BATCH_ID);
    }
  } catch (error) {
    console.error("Error generating POSTAGE_BATCH_ID:", error.message);
    throw new Error("Failed to generate POSTAGE_BATCH_ID");
  }
}

app.post('/upload', upload.single('file'), async (req, res) => {
  await generatePostageBatchId();
  try {
    const filePath = req.file.path;
    const postageBatchId = POSTAGE_BATCH_ID;

    const fileStream = fs.createReadStream(filePath);
    const result = await bee.uploadFile(postageBatchId, fileStream, path.basename(filePath), {
      encrypt: true,
    });

    fs.unlinkSync(filePath);

    res.json({
      message: 'File uploaded successfully',
      reference: result.reference,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error uploading file',
      error: error.message,
    });
  }
});



app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});


