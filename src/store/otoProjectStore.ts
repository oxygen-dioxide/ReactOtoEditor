import JSZip from "jszip";
import { Oto } from "utauoto";
import OtoRecord from "utauoto/dist/OtoRecord";
import { Wave } from "utauwav";
import { create } from "zustand";
import { GetStorageOto, SaveStorageOto } from "../services/StorageOto";
import { LOG } from "../lib/Logging";
import { fftSetting } from "../config/setting";
import { IFileSystemAdapter } from '../lib/FileSystem/FileSystemAdapter';

interface OtoProjectStore {
  fileSystem: IFileSystemAdapter | null;
  setFileSystem: (fileSystem: IFileSystemAdapter | null) => void;
  oto: Oto | null;
  setOto: (oto: Oto | null) => void;
  record: OtoRecord | null;
  setRecord: (record: OtoRecord | null) => void;
  targetDir: string | null;
  setTargetDir: (targetDir: string | null) => void;
  wavFileName: string | null;
  setWavFileName: (wavFileName: string | null) => void;
  targetDirs: Array<string> | null;
  setTargetDirs: (targetDirs: Array<string> | null) => void;
  readZip: { [key: string]: JSZip.JSZipObject } | null;
  setReadZip: (readZip: { [key: string]: JSZip.JSZipObject } | null) => void;
  zipFileName: string;
  setZipFileName: (zipFileName: string) => void;
  wav: Wave | null;
  setWav: (wav: Wave | null) => void;
}

export const useOtoProjectStore = create<OtoProjectStore>()((set, get) => ({
  fileSystem: null,
  oto: null,
  setFileSystem: (adapter: IFileSystemAdapter) => set({ fileSystem: adapter }),
  setOto: (oto) => {
    set({ oto });
    // oto の変更を監視して処理を実行
    if (oto === null) {
      set({ record: null, wavFileName: null });
      LOG.debug("otoを初期化", "OtoProjectStore");
    } else {
      const targetDir = get().targetDir;
      if (targetDir) {
        const filename: string = oto.GetFileNames(targetDir)[0];
        const alias: string = oto.GetAliases(targetDir, filename)[0];
        const record: OtoRecord = oto.GetRecord(targetDir, filename, alias);
        get().setRecord(record);
        // get().setWavFileName(filename); //ファイルネームはsetRecord内で設定される
        LOG.debug(
          `otoの読込完了。初期ファイルネーム:${filename}、初期エイリアス:${alias}`,
          "OtoProjectStore"
        );
      }
    }
  },
  record: null,
  setRecord: (record) => {
    set({ record });

    // record の変更に基づく処理
    if (record === null) {
      set({ wavFileName: null });
      LOG.debug("recordを初期化", "OtoProjectStore");
    } else {
      const { oto, zipFileName, targetDir, wavFileName } = get();
      const storagedOto: {} = GetStorageOto();
      SaveStorageOto(storagedOto, oto, zipFileName, targetDir);
      if (wavFileName !== record.filename) {
        get().setWavFileName(record.filename);
      }
      LOG.gtag("changeRecord");
      LOG.debug("localstorageに保存", "OtoProjectStore");
    }
  },
  targetDir: null,
  setTargetDir: (targetDir) => set({ targetDir }),
  targetDirs: null,
  setTargetDirs: (targetDirs) => set({ targetDirs }),
  wavFileName: null,
  setWavFileName: (wavFileName) => {
    set({ wavFileName });

    // wavFileName の変更に基づく処理
    if (wavFileName === null) {
      set({ wav: null });
      LOG.debug("wavを初期化", "OtoProjectStore");
    } else {
      const { readZip, targetDir } = get();
      if (readZip !== null) {
        const wPath =
          targetDir === "" ? wavFileName : `${targetDir}/${wavFileName}`;
        if (Object.keys(readZip).includes(wPath)) {
          readZip[wPath].async("arraybuffer").then((result) => {
            const w = new Wave(result);
            w.channels = fftSetting.channels;
            w.bitDepth = fftSetting.bitDepth;
            w.sampleRate = fftSetting.sampleRate;
            w.RemoveDCOffset();
            w.VolumeNormalize();
            set({ wav: w });
            LOG.debug(`wav読込完了。${wPath}`, "OtoProjectStore");
          });
        } else {
          LOG.debug(
            `zip内にwavが見つかりませんでした。${wPath}`,
            "OtoProjectStore"
          );
          set({ wav: null });
        }
      }
    }
  },
  readZip: null,
  setReadZip: (readZip) => set({ readZip }),
  zipFileName: "",
  setZipFileName: (zipFileName) => set({ zipFileName }),
  wav: null,
  setWav: (wav) => set({ wav }),

  loadWavFile: async (wPath: string) => {  
    const { fileSystem } = get();  
    if (!fileSystem) return null;  
      
    const buffer = await fileSystem.readFile(wPath);  
    return new Wave(buffer);  
  }  
}));
