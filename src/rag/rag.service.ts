import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';

import OpenAI from 'openai';
import { QdrantClient } from '@qdrant/js-client-rest';
import { PDFParse } from 'pdf-parse';

@Injectable()
export class RagService implements OnModuleInit {
  private readonly openai: OpenAI;

  private readonly qdrant: QdrantClient;

  private readonly collectionName =
    process.env.QDRANT_COLLECTION || 'school_documents';

  private readonly embeddingModel =
    process.env.RAG_EMBEDDING_MODEL || 'openai/text-embedding-3-small';

  private readonly vectorSize = 1536;

  /*
   * RAG chunk settings.
   */
  private readonly chunkSize = 1600;

  private readonly chunkOverlap = 250;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
    });

    this.qdrant = new QdrantClient({
      url: process.env.QDRANT_URL || 'http://localhost:6333',
    });
  }

  // ============================================================
  // MODULE INIT
  // ============================================================

  async onModuleInit() {
    await this.ensureCollection();
  }

  // ============================================================
  // ENSURE COLLECTION
  // ============================================================

  private async ensureCollection() {
    try {
      const collections = await this.qdrant.getCollections();

      const exists = collections.collections.some(
        (collection) => collection.name === this.collectionName,
      );

      if (exists) {
        console.log(`RAG collection "${this.collectionName}" already exists.`);

        return;
      }

      await this.qdrant.createCollection(this.collectionName, {
        vectors: {
          size: this.vectorSize,
          distance: 'Cosine',
        },
      });

      console.log(`RAG collection "${this.collectionName}" created.`);
    } catch (error) {
      console.error('Failed to initialize Qdrant collection:', error);
    }
  }

  // ============================================================
  // EMBEDDING
  // ============================================================

  private async createEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: this.embeddingModel,
      input: text,
    });

    return response.data[0].embedding;
  }

  // ============================================================
  // NORMAL DOCUMENT
  // ============================================================

  async addDocument(
    content: string,
    metadata: {
      title?: string;
      category?: string;
      role?: string;
      source?: string;
      documentId?: string;
      chunkIndex?: number;
    } = {},
  ) {
    if (!content?.trim()) {
      throw new BadRequestException('Document content is required.');
    }

    const vector = await this.createEmbedding(content);

    const pointId = Date.now() + Math.floor(Math.random() * 100000);

    await this.qdrant.upsert(this.collectionName, {
      wait: true,

      points: [
        {
          id: pointId,

          vector,

          payload: {
            content,

            title: metadata.title || null,

            category: metadata.category || 'general',

            role: metadata.role || 'all',

            source: metadata.source || null,

            documentId: metadata.documentId || null,

            chunkIndex: metadata.chunkIndex ?? 0,
          },
        },
      ],
    });

    return {
      success: true,

      id: pointId,

      message: 'Document added successfully.',
    };
  }

  // ============================================================
  // CHUNK TEXT
  // ============================================================

  private chunkText(text: string): string[] {
    const normalized = text
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .trim();

    if (!normalized) {
      return [];
    }

    const chunks: string[] = [];

    let start = 0;

    while (start < normalized.length) {
      let end = Math.min(start + this.chunkSize, normalized.length);

      /*
       * Try to end at a paragraph/sentence boundary.
       */

      if (end < normalized.length) {
        const boundary = normalized.lastIndexOf('\n', end);

        const sentenceBoundary = normalized.lastIndexOf('. ', end);

        const bestBoundary = Math.max(boundary, sentenceBoundary);

        if (bestBoundary > start + 500) {
          end = sentenceBoundary > boundary ? sentenceBoundary + 1 : boundary;
        }
      }

      const chunk = normalized.slice(start, end).trim();

      if (chunk) {
        chunks.push(chunk);
      }

      if (end >= normalized.length) {
        break;
      }

      start = Math.max(end - this.chunkOverlap, start + 1);
    }

    return chunks;
  }

  // ============================================================
  // ADD TEXT AS CHUNKS
  // ============================================================

  async addDocumentChunks(
    content: string,
    metadata: {
      title?: string;
      category?: string;
      role?: string;
      source?: string;
      documentId?: string;
    } = {},
  ) {
    const chunks = this.chunkText(content);

    if (!chunks.length) {
      throw new BadRequestException(
        'No readable text was found in the document.',
      );
    }

    const documentId =
      metadata.documentId ||
      `${Date.now()}-${Math.floor(Math.random() * 100000)}`;

    const points: any[] = [];

    for (let index = 0; index < chunks.length; index++) {
      const chunk = chunks[index];

      const vector = await this.createEmbedding(chunk);

      const pointId = Date.now() + index + Math.floor(Math.random() * 100000);

      points.push({
        id: pointId,

        vector,

        payload: {
          content: chunk,

          title: metadata.title || null,

          category: metadata.category || 'general',

          role: metadata.role || 'all',

          source: metadata.source || null,

          documentId,

          chunkIndex: index,
        },
      });
    }

    await this.qdrant.upsert(this.collectionName, {
      wait: true,
      points,
    });

    return {
      success: true,
      documentId,
      chunks: chunks.length,
      message: 'Document indexed successfully.',
    };
  }

  // ============================================================
  // PDF UPLOAD / INDEX
  // ============================================================

  async addPdfDocument(
    buffer: Buffer,
    metadata: {
      title?: string;
      category?: string;
      role?: string;
      source?: string;
    } = {},
  ) {
    if (!buffer || !buffer.length) {
      throw new BadRequestException('PDF file is required.');
    }

    let parser: PDFParse | null = null;

    try {
      parser = new PDFParse({
        data: buffer,
      });

      const result = await parser.getText();

      const text = result.text?.trim();

      if (!text) {
        throw new BadRequestException('No readable text was found in the PDF.');
      }

      return await this.addDocumentChunks(text, {
        title: metadata.title,
        category: metadata.category || 'pdf',
        role: metadata.role || 'all',
        source: metadata.source || 'pdf',
      });
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(error?.message || 'Failed to read PDF.');
    } finally {
      if (parser) {
        await parser.destroy();
      }
    }
  }

  // ============================================================
  // SEARCH
  // ============================================================

  async search(query: string, limit = 5, role = 'student') {
    if (!query?.trim()) {
      return [];
    }

    const vector = await this.createEmbedding(query);

    /*
     * Admin:
     *   all documents
     *
     * Teacher:
     *   teacher + all
     *
     * Student:
     *   student + all
     */

    const filter =
      role === 'admin'
        ? undefined
        : {
            should: [
              {
                key: 'role',
                match: {
                  value: role,
                },
              },

              {
                key: 'role',
                match: {
                  value: 'all',
                },
              },
            ],
          };

    const response = await this.qdrant.query(this.collectionName, {
      query: vector,

      filter,

      limit,

      with_payload: true,
    });

    return response.points.map((point: any) => ({
      id: point.id,

      score: point.score,

      content: point.payload?.content || '',

      title: point.payload?.title || null,

      category: point.payload?.category || null,

      role: point.payload?.role || 'all',

      source: point.payload?.source || null,

      documentId: point.payload?.documentId || null,

      chunkIndex: point.payload?.chunkIndex ?? 0,
    }));
  }

  // ============================================================
  // COLLECTION INFO
  // ============================================================

  async getCollectionInfo() {
    return this.qdrant.getCollection(this.collectionName);
  }
}
