import { Test, TestingModule } from '@nestjs/testing';
import { CardsController } from './cards.controller';
import { CardsService } from './cards.service';
import { CreateCardDto, UpdateCardDto } from './dto/card.dto';
import { BadRequestException } from '@nestjs/common';

describe('CardsController', () => {
  let controller: CardsController;
  let service: CardsService;

  const mockCard = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Test Card',
    description: 'Test Description',
    fileKey: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const mockCardsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    uploadFile: jest.fn(),
    getFileUrl: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CardsController],
      providers: [
        {
          provide: CardsService,
          useValue: mockCardsService,
        },
      ],
    }).compile();

    controller = module.get<CardsController>(CardsController);
    service = module.get<CardsService>(CardsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new card', async () => {
      const createCardDto: CreateCardDto = {
        title: 'Test Card',
        description: 'Test Description',
      };

      mockCardsService.create.mockResolvedValue(mockCard);

      const result = await controller.create(createCardDto);

      expect(result).toEqual(mockCard);
      expect(service.create).toHaveBeenCalledWith(createCardDto);
      expect(service.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('should return an array of cards', async () => {
      const mockCards = [mockCard, { ...mockCard, id: 'another-id' }];
      mockCardsService.findAll.mockResolvedValue(mockCards);

      const result = await controller.findAll();

      expect(result).toEqual(mockCards);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no cards exist', async () => {
      mockCardsService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a single card by id', async () => {
      mockCardsService.findOne.mockResolvedValue(mockCard);

      const result = await controller.findOne(mockCard.id);

      expect(result).toEqual(mockCard);
      expect(service.findOne).toHaveBeenCalledWith(mockCard.id);
      expect(service.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('should update a card', async () => {
      const updateCardDto: UpdateCardDto = {
        title: 'Updated Title',
        description: 'Updated Description',
      };

      const updatedCard = { ...mockCard, ...updateCardDto };
      mockCardsService.update.mockResolvedValue(updatedCard);

      const result = await controller.update(mockCard.id, updateCardDto);

      expect(result).toEqual(updatedCard);
      expect(service.update).toHaveBeenCalledWith(mockCard.id, updateCardDto);
      expect(service.update).toHaveBeenCalledTimes(1);
    });

    it('should update only title', async () => {
      const updateCardDto: UpdateCardDto = {
        title: 'Updated Title Only',
      };

      const updatedCard = { ...mockCard, ...updateCardDto };
      mockCardsService.update.mockResolvedValue(updatedCard);

      const result = await controller.update(mockCard.id, updateCardDto);

      expect(result).toEqual(updatedCard);
      expect(service.update).toHaveBeenCalledWith(mockCard.id, updateCardDto);
    });
  });

  describe('remove', () => {
    it('should delete a card and return success message', async () => {
      mockCardsService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(mockCard.id);

      expect(result).toEqual({ message: 'Card deleted successfully' });
      expect(service.remove).toHaveBeenCalledWith(mockCard.id);
      expect(service.remove).toHaveBeenCalledTimes(1);
    });
  });

  describe('uploadFile', () => {
    it('should upload a file to a card', async () => {
      const mockFile = {
        buffer: Buffer.from('test'),
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
        size: 1024,
      } as Express.Multer.File;

      const cardWithFile = {
        ...mockCard,
        fileKey: 'uploads/test.pdf',
      };

      mockCardsService.uploadFile.mockResolvedValue(cardWithFile);

      const result = await controller.uploadFile(mockCard.id, mockFile);

      expect(result).toEqual(cardWithFile);
      expect(service.uploadFile).toHaveBeenCalledWith(mockCard.id, mockFile);
      expect(service.uploadFile).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException when no file is provided', () => {
      expect(() => controller.uploadFile(mockCard.id, null as any)).toThrow(
        BadRequestException,
      );

      expect(service.uploadFile).not.toHaveBeenCalled();
    });
  });

  describe('getFileUrl', () => {
    it('should return presigned URL for card file', async () => {
      const mockUrl = {
        url: 'https://s3.amazonaws.com/presigned-url',
      };

      mockCardsService.getFileUrl.mockResolvedValue(mockUrl);

      const result = await controller.getFileUrl(mockCard.id);

      expect(result).toEqual(mockUrl);
      expect(service.getFileUrl).toHaveBeenCalledWith(mockCard.id);
      expect(service.getFileUrl).toHaveBeenCalledTimes(1);
    });
  });
});
