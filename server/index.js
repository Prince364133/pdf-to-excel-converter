const fastify = require('fastify')({ logger: true });
const fastifyMultipart = require('@fastify/multipart');
const fastifyCors = require('@fastify/cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream');
const util = require('util');
const pump = util.promisify(pipeline);

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000/extract-tables';

fastify.register(fastifyCors, {
  origin: '*', // For development
});

fastify.register(fastifyMultipart, {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

fastify.get('/', async (request, reply) => {
  return { status: 'TimeLoop API Gateway is running' };
});

fastify.post('/upload', async (request, reply) => {
  const data = await request.files();
  const allExtractedData = [];
  const errors = [];

  for await (const part of data) {
    if (part.file) {
      const tempPath = path.join(__dirname, 'uploads', part.filename);
      if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
        fs.mkdirSync(path.join(__dirname, 'uploads'));
      }

      await pump(part.file, fs.createWriteStream(tempPath));

      try {
        // Forward to Python service
        const formData = new (require('form-data'))();
        formData.append('file', fs.createReadStream(tempPath));

        const response = await axios.post(PYTHON_SERVICE_URL, formData, {
          headers: {
            ...formData.getHeaders(),
          },
        });

        allExtractedData.push({
          filename: part.filename,
          data: response.data.data,
        });
      } catch (err) {
        console.error(`Error processing ${part.filename}:`, err.message);
        errors.push({
          filename: part.filename,
          error: err.response?.data?.detail || err.message,
        });
      } finally {
        // Clean up temp file
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
      }
    }
  }

  // Merge all rows into a single dataset as per requirement
  const mergedData = allExtractedData.reduce((acc, curr) => {
    return acc.concat(curr.data);
  }, []);

  return {
    success: mergedData.length > 0,
    count: mergedData.length,
    data: mergedData,
    errors: errors.length > 0 ? errors : undefined,
  };
});

const start = async () => {
  try {
    const port = process.env.PORT || 3001;
    await fastify.listen({ port: parseInt(port), host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
