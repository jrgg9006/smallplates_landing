import {
  annexSrcStoragePath,
  annexPrintStoragePath,
  shouldQueueForUpscale,
  isAnnexProcessing,
} from './upscale';

describe('annexSrcStoragePath', () => {
  it('construye el path del PNG normalizado', () => {
    expect(annexSrcStoragePath('g1', 'r1', 0)).toBe('print/annex/g1/r1_0_src.png');
    expect(annexSrcStoragePath('g1', 'r1', 2)).toBe('print/annex/g1/r1_2_src.png');
  });
});

describe('annexPrintStoragePath', () => {
  it('construye el path del PNG escalado', () => {
    expect(annexPrintStoragePath('g1', 'r1', 0)).toBe('print/annex/g1/r1_0.png');
  });
  it('difiere del path normalizado solo por el sufijo _src', () => {
    expect(annexPrintStoragePath('g', 'r', 1)).not.toBe(annexSrcStoragePath('g', 'r', 1));
  });
});

describe('shouldQueueForUpscale', () => {
  it('encola filas nunca procesadas o con error', () => {
    expect(shouldQueueForUpscale(null)).toBe(true);
    expect(shouldQueueForUpscale('error')).toBe(true);
  });
  it('no re-encola filas en vuelo o ya listas', () => {
    expect(shouldQueueForUpscale('pending')).toBe(false);
    expect(shouldQueueForUpscale('processing')).toBe(false);
    expect(shouldQueueForUpscale('ready')).toBe(false);
  });
});

describe('isAnnexProcessing', () => {
  it('true solo para estados no terminales', () => {
    expect(isAnnexProcessing('pending')).toBe(true);
    expect(isAnnexProcessing('processing')).toBe(true);
  });
  it('false para terminales y null', () => {
    expect(isAnnexProcessing('ready')).toBe(false);
    expect(isAnnexProcessing('error')).toBe(false);
    expect(isAnnexProcessing(null)).toBe(false);
  });
});
