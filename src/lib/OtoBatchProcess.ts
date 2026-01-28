import OtoRecord from "utauoto/dist/OtoRecord";
import { Wave } from "utauwav";
import { Oto } from "utauoto";
import JSZip from "jszip";

/**
 * 存在しないファイルを参照するレコードを一括で削除する
 * @param oto 原音設定データ
 * @param targetDir zipファイル内のoto.iniまでの相対パス
 * @param zip zip内のファイル一覧
 */
export const WaveNotFound = (
  oto: Oto,
  targetDir: string,
  zip: { [key: string]: JSZip.JSZipObject }
) => {
  const files = Object.keys(zip);
  oto.GetFileNames(targetDir).forEach((f) => {
    if (!files.includes(targetDir + "/" + f)) {
      oto.RemoveFileName(targetDir, f);
    }
  });
};

/**
 * レコードが1つも存在しないwavに対して空のレコードを作成する。
 * @param oto 原音設定データ
 * @param targetDir zipファイル内のoto.iniまでの相対パス
 * @param zip zip内のファイル一覧
 */
export const RecordNotFound = (
  oto: Oto,
  targetDir: string,
  zip: { [key: string]: JSZip.JSZipObject }
) => {
  const files = oto.GetFileNames(targetDir);
  Object.keys(zip).forEach((f) => {
    if (f.startsWith(targetDir + "/")) {
      if (
        !files.includes(f.replace(targetDir + "/", "")) &&
        f.replace(targetDir + "/", "").endsWith(".wav")
      ) {
        oto.SetParams(
          targetDir,
          f.replace(targetDir + "/", ""),
          "",
          0,
          0,
          0,
          0,
          0
        );
      }
    }
  });
};

/**
 * 重複するエイリアスに連番を振る
 * @param oto 原音設定データ
 * @param targetDir zipファイル内のoto.iniまでの相対パス
 * @param surfix 末尾の無視する文字
 * @param limit 連番の最大値
 */
export const NumberingDuplicationAlias = (
  oto: Oto,
  targetDir: string,
  surfix: string,
  limit: number
) => {
  const aliases = [];
  oto.GetFileNames(targetDir).forEach((f) => {
    oto.GetAliases(targetDir, f).forEach((a) => {
      let tmp = a;
      if (tmp.endsWith(surfix)) {
        tmp = a.replace(surfix, "");
      }
      if (aliases.includes(tmp)) {
        let i = 2;
        while (aliases.includes(tmp + i)) {
          i++;
        }
        if (i <= limit) {
          aliases.push(tmp + i + surfix);
          oto.SetAlias(targetDir, f, a, tmp + i + surfix);
        } else {
          oto.RemoveAlias(targetDir, f, a);
        }
      } else {
        aliases.push(tmp);
      }
    });
  });
};

/**
 * 連番が大きいエイリアスを削除する。
 * @param oto 原音設定データ
 * @param targetDir zipファイル内のoto.iniまでの相対パス
 * @param surfix 末尾の無視する文字
 * @param limit 連番の最大値
 */
export const LimitedNumber = (
  oto: Oto,
  targetDir: string,
  surfix: string,
  limit: number
) => {
  const reg = /([0-9]+)$/;
  oto.GetFileNames(targetDir).forEach((f) => {
    oto.GetAliases(targetDir, f).forEach((a) => {
      let tmp = a;
      if (tmp.endsWith(surfix)) {
        tmp = a.replace(surfix, "");
      }
      const result = tmp.match(reg);
      if (result === null) {
      } else if (result.length >= 1) {
        const n = parseInt(result[0]);
        if (n > limit) {
          oto.RemoveAlias(targetDir, f, a);
        }
      }
    });
  });
};

/**
 * 右ブランクを負の数で統一する。
 * @param oto 原音設定データ
 * @param targetDir zipファイル内のoto.iniまでの相対パス
 * @param zip zip内のファイル一覧
 */
export const NegativeBlank = async (
  oto: Oto,
  targetDir: string,
  zip: { [key: string]: JSZip.JSZipObject }
) => {
  for (const f of oto.GetFileNames(targetDir)) {
    const buf = await zip[targetDir + "/" + f].async("arraybuffer");
    const wav = new Wave(buf);
    oto.GetAliases(targetDir, f).forEach((a) => {
      const record = oto.GetRecord(targetDir, f, a);
      if (record.blank >= 0) {
        const msLength = (wav.data.length / wav.sampleRate) * 1000;
        const blankPos = msLength - record.blank;
        record.blank = record.offset - blankPos;
      }
    });
  }
};

/**
 * オーバーラップを先行発声の1/3で統一する
 * @param oto 原音設定データ
 * @param targetDir zipファイル内のoto.iniまでの相対パス
 */
export const ForceOverlapRate = (oto: Oto, targetDir: string) => {
  oto.GetFileNames(targetDir).forEach((f) => {
    oto.GetAliases(targetDir, f).forEach((a) => {
      const record = oto.GetRecord(targetDir, f, a);
      record.overlap = record.pre / 3;
    });
  });
};

/**
 * エイリアスの末尾から指定した文字列を削除する
 * @param oto 原音設定データ
 * @param targetDir zipファイル内のoto.iniまでの相対パス
 * @param surfix 削除する文字列
 */
export const RemoveSurfix = (oto: Oto, targetDir: string, surfix: string) => {
  const reg = new RegExp(surfix + "$");
  oto.GetFileNames(targetDir).forEach((f) => {
    oto.GetAliases(targetDir, f).forEach((a) => {
      if (a.endsWith(surfix)) {
        const newAlias = a.replace(reg, "");
        oto.SetAlias(targetDir, f, a, newAlias);
      }
    });
  });
};

/**
 * エイリアスの末尾から指定した文字列を追加する
 * @param oto 原音設定データ
 * @param targetDir zipファイル内のoto.iniまでの相対パス
 * @param surfix 追加する文字列
 */
export const AddSurfix = (oto: Oto, targetDir: string, surfix: string) => {
  oto.GetFileNames(targetDir).forEach((f) => {
    oto.GetAliases(targetDir, f).forEach((a) => {
      oto.SetAlias(targetDir, f, a, a + surfix);
    });
  });
};

/**
 * 指定したパラメータに指定した値を加える。
 * @param oto 原音設定データ
 * @param targetDir zipファイル内のoto.iniまでの相対パス
 * @param targetParam 対象パラメータ
 * @param value 加える値
 */
export const AddParams = (
  oto: Oto,
  targetDir: string,
  targetParam: "offset" | "overlap" | "preutter" | "velocity" | "blank",
  value: number
) => {
  oto.GetFileNames(targetDir).forEach((f) => {
    oto.GetAliases(targetDir, f).forEach((a) => {
      if (targetParam === "offset") {
        oto.GetRecord(targetDir, f, a).offset += value;
      } else if (targetParam === "overlap") {
        oto.GetRecord(targetDir, f, a).overlap += value;
      } else if (targetParam === "preutter") {
        oto.GetRecord(targetDir, f, a).pre += value;
      } else if (targetParam === "velocity") {
        oto.GetRecord(targetDir, f, a).velocity += value;
      } else if (targetParam === "blank") {
        oto.GetRecord(targetDir, f, a).blank += value;
      }
    });
  });
};

/**
 * 指定したパラメータにの値を変更する。
 * @param oto 原音設定データ
 * @param targetDir zipファイル内のoto.iniまでの相対パス
 * @param targetParam 対象パラメータ
 * @param value 変更後の値
 */
export const ChangeParams = (
  oto: Oto,
  targetDir: string,
  targetParam: "offset" | "overlap" | "preutter" | "velocity" | "blank",
  value: number
) => {
  oto.GetFileNames(targetDir).forEach((f) => {
    oto.GetAliases(targetDir, f).forEach((a) => {
      if (targetParam === "offset") {
        oto.GetRecord(targetDir, f, a).offset = value;
      } else if (targetParam === "overlap") {
        oto.GetRecord(targetDir, f, a).overlap = value;
      } else if (targetParam === "preutter") {
        oto.GetRecord(targetDir, f, a).pre = value;
      } else if (targetParam === "velocity") {
        oto.GetRecord(targetDir, f, a).velocity = value;
      } else if (targetParam === "blank") {
        oto.GetRecord(targetDir, f, a).blank = value;
      }
    });
  });
};

/**
 * を/ぢ/づ が存在しないとき、お/じ/ず で補完する
 * @param oto 原音設定データ
 * @param targetDir zipファイル内のoto.iniまでの相対パス
 */
export const AliasComplement = (oto: Oto, targetDir: string) => {
  oto.GetFileNames(targetDir).forEach((f) => {
    oto.GetAliases(targetDir, f).forEach((a) => {
      let newAlias = "";
      const record = oto.GetRecord(targetDir, f, a);
      if (a.includes("お")) {
        newAlias = a.replace("お", "を");
      } else if (a.includes("じ")) {
        newAlias = a.replace("じ", "ぢ");
      } else if (a.includes("ず")) {
        newAlias = a.replace("ず", "づ");
      }
      if (newAlias !== "") {
        if (!oto.HasOtoRecord(targetDir, f, newAlias)) {
          oto.SetParams(
            targetDir,
            f,
            newAlias,
            record.offset,
            record.overlap,
            record.pre,
            record.velocity,
            record.blank
          );
        }
      }
    });
  });
};
