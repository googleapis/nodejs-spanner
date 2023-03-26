import * as $protobuf from "protobufjs";
import Long = require("long");
/** Namespace spanner. */
export namespace spanner {

  /** Namespace examples. */
  namespace examples {

    /** Namespace music. */
    namespace music {

      /** Properties of a SingerInfo. */
      interface ISingerInfo {

        /** SingerInfo singerId */
        singerId?: (number|Long|null);

        /** SingerInfo birthDate */
        birthDate?: (string|null);

        /** SingerInfo nationality */
        nationality?: (string|null);

        /** SingerInfo genre */
        genre?: (spanner.examples.music.Genre|null);
      }

      /** Represents a SingerInfo. */
      class SingerInfo implements ISingerInfo {

        /**
         * Constructs a new SingerInfo.
         * @param [properties] Properties to set
         */
        constructor(properties?: spanner.examples.music.ISingerInfo);

        /** SingerInfo singerId. */
        public singerId: (number|Long);

        /** SingerInfo birthDate. */
        public birthDate: string;

        /** SingerInfo nationality. */
        public nationality: string;

        /** SingerInfo genre. */
        public genre: spanner.examples.music.Genre;

        /**
         * Creates a new SingerInfo instance using the specified properties.
         * @param [properties] Properties to set
         * @returns SingerInfo instance
         */
        public static create(properties?: spanner.examples.music.ISingerInfo): spanner.examples.music.SingerInfo;

        /**
         * Encodes the specified SingerInfo message. Does not implicitly {@link spanner.examples.music.SingerInfo.verify|verify} messages.
         * @param message SingerInfo message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: spanner.examples.music.ISingerInfo, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified SingerInfo message, length delimited. Does not implicitly {@link spanner.examples.music.SingerInfo.verify|verify} messages.
         * @param message SingerInfo message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: spanner.examples.music.ISingerInfo, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a SingerInfo message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns SingerInfo
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): spanner.examples.music.SingerInfo;

        /**
         * Decodes a SingerInfo message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns SingerInfo
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): spanner.examples.music.SingerInfo;

        /**
         * Verifies a SingerInfo message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a SingerInfo message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns SingerInfo
         */
        public static fromObject(object: { [k: string]: any }): spanner.examples.music.SingerInfo;

        /**
         * Creates a plain object from a SingerInfo message. Also converts values to other types if specified.
         * @param message SingerInfo
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: spanner.examples.music.SingerInfo, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this SingerInfo to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for SingerInfo
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
      }

      /** Genre enum. */
      enum Genre {
        POP = 0,
        JAZZ = 1,
        FOLK = 2,
        ROCK = 3
      }
    }
  }
}
