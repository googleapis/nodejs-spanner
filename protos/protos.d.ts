// Copyright 2022 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import * as Long from "long";
import {protobuf as $protobuf} from "google-gax";
/** Namespace google. */
export namespace google {

    /** Namespace protobuf. */
    namespace protobuf {

        /** Properties of a Duration. */
        interface IDuration {

            /** Duration seconds */
            seconds?: (number|Long|string|null);

            /** Duration nanos */
            nanos?: (number|null);
        }

        /** Represents a Duration. */
        class Duration implements IDuration {

            /**
             * Constructs a new Duration.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IDuration);

            /** Duration seconds. */
            public seconds: (number|Long|string);

            /** Duration nanos. */
            public nanos: number;

            /**
             * Creates a new Duration instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Duration instance
             */
            public static create(properties?: google.protobuf.IDuration): google.protobuf.Duration;

            /**
             * Encodes the specified Duration message. Does not implicitly {@link google.protobuf.Duration.verify|verify} messages.
             * @param message Duration message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IDuration, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Duration message, length delimited. Does not implicitly {@link google.protobuf.Duration.verify|verify} messages.
             * @param message Duration message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IDuration, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Duration message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Duration
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.Duration;

            /**
             * Decodes a Duration message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Duration
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.Duration;

            /**
             * Verifies a Duration message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Duration message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Duration
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.Duration;

            /**
             * Creates a plain object from a Duration message. Also converts values to other types if specified.
             * @param message Duration
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.Duration, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Duration to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a FileDescriptorSet. */
        interface IFileDescriptorSet {

            /** FileDescriptorSet file */
            file?: (google.protobuf.IFileDescriptorProto[]|null);
        }

        /** Represents a FileDescriptorSet. */
        class FileDescriptorSet implements IFileDescriptorSet {

            /**
             * Constructs a new FileDescriptorSet.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IFileDescriptorSet);

            /** FileDescriptorSet file. */
            public file: google.protobuf.IFileDescriptorProto[];

            /**
             * Creates a new FileDescriptorSet instance using the specified properties.
             * @param [properties] Properties to set
             * @returns FileDescriptorSet instance
             */
            public static create(properties?: google.protobuf.IFileDescriptorSet): google.protobuf.FileDescriptorSet;

            /**
             * Encodes the specified FileDescriptorSet message. Does not implicitly {@link google.protobuf.FileDescriptorSet.verify|verify} messages.
             * @param message FileDescriptorSet message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IFileDescriptorSet, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified FileDescriptorSet message, length delimited. Does not implicitly {@link google.protobuf.FileDescriptorSet.verify|verify} messages.
             * @param message FileDescriptorSet message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IFileDescriptorSet, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a FileDescriptorSet message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns FileDescriptorSet
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.FileDescriptorSet;

            /**
             * Decodes a FileDescriptorSet message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns FileDescriptorSet
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.FileDescriptorSet;

            /**
             * Verifies a FileDescriptorSet message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a FileDescriptorSet message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns FileDescriptorSet
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.FileDescriptorSet;

            /**
             * Creates a plain object from a FileDescriptorSet message. Also converts values to other types if specified.
             * @param message FileDescriptorSet
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.FileDescriptorSet, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this FileDescriptorSet to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a FileDescriptorProto. */
        interface IFileDescriptorProto {

            /** FileDescriptorProto name */
            name?: (string|null);

            /** FileDescriptorProto package */
            "package"?: (string|null);

            /** FileDescriptorProto dependency */
            dependency?: (string[]|null);

            /** FileDescriptorProto publicDependency */
            publicDependency?: (number[]|null);

            /** FileDescriptorProto weakDependency */
            weakDependency?: (number[]|null);

            /** FileDescriptorProto messageType */
            messageType?: (google.protobuf.IDescriptorProto[]|null);

            /** FileDescriptorProto enumType */
            enumType?: (google.protobuf.IEnumDescriptorProto[]|null);

            /** FileDescriptorProto service */
            service?: (google.protobuf.IServiceDescriptorProto[]|null);

            /** FileDescriptorProto extension */
            extension?: (google.protobuf.IFieldDescriptorProto[]|null);

            /** FileDescriptorProto options */
            options?: (google.protobuf.IFileOptions|null);

            /** FileDescriptorProto sourceCodeInfo */
            sourceCodeInfo?: (google.protobuf.ISourceCodeInfo|null);

            /** FileDescriptorProto syntax */
            syntax?: (string|null);
        }

        /** Represents a FileDescriptorProto. */
        class FileDescriptorProto implements IFileDescriptorProto {

            /**
             * Constructs a new FileDescriptorProto.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IFileDescriptorProto);

            /** FileDescriptorProto name. */
            public name: string;

            /** FileDescriptorProto package. */
            public package: string;

            /** FileDescriptorProto dependency. */
            public dependency: string[];

            /** FileDescriptorProto publicDependency. */
            public publicDependency: number[];

            /** FileDescriptorProto weakDependency. */
            public weakDependency: number[];

            /** FileDescriptorProto messageType. */
            public messageType: google.protobuf.IDescriptorProto[];

            /** FileDescriptorProto enumType. */
            public enumType: google.protobuf.IEnumDescriptorProto[];

            /** FileDescriptorProto service. */
            public service: google.protobuf.IServiceDescriptorProto[];

            /** FileDescriptorProto extension. */
            public extension: google.protobuf.IFieldDescriptorProto[];

            /** FileDescriptorProto options. */
            public options?: (google.protobuf.IFileOptions|null);

            /** FileDescriptorProto sourceCodeInfo. */
            public sourceCodeInfo?: (google.protobuf.ISourceCodeInfo|null);

            /** FileDescriptorProto syntax. */
            public syntax: string;

            /**
             * Creates a new FileDescriptorProto instance using the specified properties.
             * @param [properties] Properties to set
             * @returns FileDescriptorProto instance
             */
            public static create(properties?: google.protobuf.IFileDescriptorProto): google.protobuf.FileDescriptorProto;

            /**
             * Encodes the specified FileDescriptorProto message. Does not implicitly {@link google.protobuf.FileDescriptorProto.verify|verify} messages.
             * @param message FileDescriptorProto message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IFileDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified FileDescriptorProto message, length delimited. Does not implicitly {@link google.protobuf.FileDescriptorProto.verify|verify} messages.
             * @param message FileDescriptorProto message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IFileDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a FileDescriptorProto message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns FileDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.FileDescriptorProto;

            /**
             * Decodes a FileDescriptorProto message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns FileDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.FileDescriptorProto;

            /**
             * Verifies a FileDescriptorProto message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a FileDescriptorProto message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns FileDescriptorProto
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.FileDescriptorProto;

            /**
             * Creates a plain object from a FileDescriptorProto message. Also converts values to other types if specified.
             * @param message FileDescriptorProto
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.FileDescriptorProto, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this FileDescriptorProto to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a DescriptorProto. */
        interface IDescriptorProto {

            /** DescriptorProto name */
            name?: (string|null);

            /** DescriptorProto field */
            field?: (google.protobuf.IFieldDescriptorProto[]|null);

            /** DescriptorProto extension */
            extension?: (google.protobuf.IFieldDescriptorProto[]|null);

            /** DescriptorProto nestedType */
            nestedType?: (google.protobuf.IDescriptorProto[]|null);

            /** DescriptorProto enumType */
            enumType?: (google.protobuf.IEnumDescriptorProto[]|null);

            /** DescriptorProto extensionRange */
            extensionRange?: (google.protobuf.DescriptorProto.IExtensionRange[]|null);

            /** DescriptorProto oneofDecl */
            oneofDecl?: (google.protobuf.IOneofDescriptorProto[]|null);

            /** DescriptorProto options */
            options?: (google.protobuf.IMessageOptions|null);

            /** DescriptorProto reservedRange */
            reservedRange?: (google.protobuf.DescriptorProto.IReservedRange[]|null);

            /** DescriptorProto reservedName */
            reservedName?: (string[]|null);
        }

        /** Represents a DescriptorProto. */
        class DescriptorProto implements IDescriptorProto {

            /**
             * Constructs a new DescriptorProto.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IDescriptorProto);

            /** DescriptorProto name. */
            public name: string;

            /** DescriptorProto field. */
            public field: google.protobuf.IFieldDescriptorProto[];

            /** DescriptorProto extension. */
            public extension: google.protobuf.IFieldDescriptorProto[];

            /** DescriptorProto nestedType. */
            public nestedType: google.protobuf.IDescriptorProto[];

            /** DescriptorProto enumType. */
            public enumType: google.protobuf.IEnumDescriptorProto[];

            /** DescriptorProto extensionRange. */
            public extensionRange: google.protobuf.DescriptorProto.IExtensionRange[];

            /** DescriptorProto oneofDecl. */
            public oneofDecl: google.protobuf.IOneofDescriptorProto[];

            /** DescriptorProto options. */
            public options?: (google.protobuf.IMessageOptions|null);

            /** DescriptorProto reservedRange. */
            public reservedRange: google.protobuf.DescriptorProto.IReservedRange[];

            /** DescriptorProto reservedName. */
            public reservedName: string[];

            /**
             * Creates a new DescriptorProto instance using the specified properties.
             * @param [properties] Properties to set
             * @returns DescriptorProto instance
             */
            public static create(properties?: google.protobuf.IDescriptorProto): google.protobuf.DescriptorProto;

            /**
             * Encodes the specified DescriptorProto message. Does not implicitly {@link google.protobuf.DescriptorProto.verify|verify} messages.
             * @param message DescriptorProto message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified DescriptorProto message, length delimited. Does not implicitly {@link google.protobuf.DescriptorProto.verify|verify} messages.
             * @param message DescriptorProto message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a DescriptorProto message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns DescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.DescriptorProto;

            /**
             * Decodes a DescriptorProto message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns DescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.DescriptorProto;

            /**
             * Verifies a DescriptorProto message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a DescriptorProto message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns DescriptorProto
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.DescriptorProto;

            /**
             * Creates a plain object from a DescriptorProto message. Also converts values to other types if specified.
             * @param message DescriptorProto
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.DescriptorProto, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this DescriptorProto to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        namespace DescriptorProto {

            /** Properties of an ExtensionRange. */
            interface IExtensionRange {

                /** ExtensionRange start */
                start?: (number|null);

                /** ExtensionRange end */
                end?: (number|null);

                /** ExtensionRange options */
                options?: (google.protobuf.IExtensionRangeOptions|null);
            }

            /** Represents an ExtensionRange. */
            class ExtensionRange implements IExtensionRange {

                /**
                 * Constructs a new ExtensionRange.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.protobuf.DescriptorProto.IExtensionRange);

                /** ExtensionRange start. */
                public start: number;

                /** ExtensionRange end. */
                public end: number;

                /** ExtensionRange options. */
                public options?: (google.protobuf.IExtensionRangeOptions|null);

                /**
                 * Creates a new ExtensionRange instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns ExtensionRange instance
                 */
                public static create(properties?: google.protobuf.DescriptorProto.IExtensionRange): google.protobuf.DescriptorProto.ExtensionRange;

                /**
                 * Encodes the specified ExtensionRange message. Does not implicitly {@link google.protobuf.DescriptorProto.ExtensionRange.verify|verify} messages.
                 * @param message ExtensionRange message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.protobuf.DescriptorProto.IExtensionRange, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified ExtensionRange message, length delimited. Does not implicitly {@link google.protobuf.DescriptorProto.ExtensionRange.verify|verify} messages.
                 * @param message ExtensionRange message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.protobuf.DescriptorProto.IExtensionRange, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes an ExtensionRange message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns ExtensionRange
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.DescriptorProto.ExtensionRange;

                /**
                 * Decodes an ExtensionRange message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns ExtensionRange
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.DescriptorProto.ExtensionRange;

                /**
                 * Verifies an ExtensionRange message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates an ExtensionRange message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns ExtensionRange
                 */
                public static fromObject(object: { [k: string]: any }): google.protobuf.DescriptorProto.ExtensionRange;

                /**
                 * Creates a plain object from an ExtensionRange message. Also converts values to other types if specified.
                 * @param message ExtensionRange
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.protobuf.DescriptorProto.ExtensionRange, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this ExtensionRange to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a ReservedRange. */
            interface IReservedRange {

                /** ReservedRange start */
                start?: (number|null);

                /** ReservedRange end */
                end?: (number|null);
            }

            /** Represents a ReservedRange. */
            class ReservedRange implements IReservedRange {

                /**
                 * Constructs a new ReservedRange.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.protobuf.DescriptorProto.IReservedRange);

                /** ReservedRange start. */
                public start: number;

                /** ReservedRange end. */
                public end: number;

                /**
                 * Creates a new ReservedRange instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns ReservedRange instance
                 */
                public static create(properties?: google.protobuf.DescriptorProto.IReservedRange): google.protobuf.DescriptorProto.ReservedRange;

                /**
                 * Encodes the specified ReservedRange message. Does not implicitly {@link google.protobuf.DescriptorProto.ReservedRange.verify|verify} messages.
                 * @param message ReservedRange message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.protobuf.DescriptorProto.IReservedRange, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified ReservedRange message, length delimited. Does not implicitly {@link google.protobuf.DescriptorProto.ReservedRange.verify|verify} messages.
                 * @param message ReservedRange message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.protobuf.DescriptorProto.IReservedRange, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a ReservedRange message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns ReservedRange
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.DescriptorProto.ReservedRange;

                /**
                 * Decodes a ReservedRange message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns ReservedRange
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.DescriptorProto.ReservedRange;

                /**
                 * Verifies a ReservedRange message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a ReservedRange message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns ReservedRange
                 */
                public static fromObject(object: { [k: string]: any }): google.protobuf.DescriptorProto.ReservedRange;

                /**
                 * Creates a plain object from a ReservedRange message. Also converts values to other types if specified.
                 * @param message ReservedRange
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.protobuf.DescriptorProto.ReservedRange, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this ReservedRange to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }
        }

        /** Properties of an ExtensionRangeOptions. */
        interface IExtensionRangeOptions {

            /** ExtensionRangeOptions uninterpretedOption */
            uninterpretedOption?: (google.protobuf.IUninterpretedOption[]|null);
        }

        /** Represents an ExtensionRangeOptions. */
        class ExtensionRangeOptions implements IExtensionRangeOptions {

            /**
             * Constructs a new ExtensionRangeOptions.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IExtensionRangeOptions);

            /** ExtensionRangeOptions uninterpretedOption. */
            public uninterpretedOption: google.protobuf.IUninterpretedOption[];

            /**
             * Creates a new ExtensionRangeOptions instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ExtensionRangeOptions instance
             */
            public static create(properties?: google.protobuf.IExtensionRangeOptions): google.protobuf.ExtensionRangeOptions;

            /**
             * Encodes the specified ExtensionRangeOptions message. Does not implicitly {@link google.protobuf.ExtensionRangeOptions.verify|verify} messages.
             * @param message ExtensionRangeOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IExtensionRangeOptions, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ExtensionRangeOptions message, length delimited. Does not implicitly {@link google.protobuf.ExtensionRangeOptions.verify|verify} messages.
             * @param message ExtensionRangeOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IExtensionRangeOptions, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an ExtensionRangeOptions message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ExtensionRangeOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.ExtensionRangeOptions;

            /**
             * Decodes an ExtensionRangeOptions message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ExtensionRangeOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.ExtensionRangeOptions;

            /**
             * Verifies an ExtensionRangeOptions message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an ExtensionRangeOptions message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ExtensionRangeOptions
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.ExtensionRangeOptions;

            /**
             * Creates a plain object from an ExtensionRangeOptions message. Also converts values to other types if specified.
             * @param message ExtensionRangeOptions
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.ExtensionRangeOptions, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ExtensionRangeOptions to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a FieldDescriptorProto. */
        interface IFieldDescriptorProto {

            /** FieldDescriptorProto name */
            name?: (string|null);

            /** FieldDescriptorProto number */
            number?: (number|null);

            /** FieldDescriptorProto label */
            label?: (google.protobuf.FieldDescriptorProto.Label|keyof typeof google.protobuf.FieldDescriptorProto.Label|null);

            /** FieldDescriptorProto type */
            type?: (google.protobuf.FieldDescriptorProto.Type|keyof typeof google.protobuf.FieldDescriptorProto.Type|null);

            /** FieldDescriptorProto typeName */
            typeName?: (string|null);

            /** FieldDescriptorProto extendee */
            extendee?: (string|null);

            /** FieldDescriptorProto defaultValue */
            defaultValue?: (string|null);

            /** FieldDescriptorProto oneofIndex */
            oneofIndex?: (number|null);

            /** FieldDescriptorProto jsonName */
            jsonName?: (string|null);

            /** FieldDescriptorProto options */
            options?: (google.protobuf.IFieldOptions|null);

            /** FieldDescriptorProto proto3Optional */
            proto3Optional?: (boolean|null);
        }

        /** Represents a FieldDescriptorProto. */
        class FieldDescriptorProto implements IFieldDescriptorProto {

            /**
             * Constructs a new FieldDescriptorProto.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IFieldDescriptorProto);

            /** FieldDescriptorProto name. */
            public name: string;

            /** FieldDescriptorProto number. */
            public number: number;

            /** FieldDescriptorProto label. */
            public label: (google.protobuf.FieldDescriptorProto.Label|keyof typeof google.protobuf.FieldDescriptorProto.Label);

            /** FieldDescriptorProto type. */
            public type: (google.protobuf.FieldDescriptorProto.Type|keyof typeof google.protobuf.FieldDescriptorProto.Type);

            /** FieldDescriptorProto typeName. */
            public typeName: string;

            /** FieldDescriptorProto extendee. */
            public extendee: string;

            /** FieldDescriptorProto defaultValue. */
            public defaultValue: string;

            /** FieldDescriptorProto oneofIndex. */
            public oneofIndex: number;

            /** FieldDescriptorProto jsonName. */
            public jsonName: string;

            /** FieldDescriptorProto options. */
            public options?: (google.protobuf.IFieldOptions|null);

            /** FieldDescriptorProto proto3Optional. */
            public proto3Optional: boolean;

            /**
             * Creates a new FieldDescriptorProto instance using the specified properties.
             * @param [properties] Properties to set
             * @returns FieldDescriptorProto instance
             */
            public static create(properties?: google.protobuf.IFieldDescriptorProto): google.protobuf.FieldDescriptorProto;

            /**
             * Encodes the specified FieldDescriptorProto message. Does not implicitly {@link google.protobuf.FieldDescriptorProto.verify|verify} messages.
             * @param message FieldDescriptorProto message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IFieldDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified FieldDescriptorProto message, length delimited. Does not implicitly {@link google.protobuf.FieldDescriptorProto.verify|verify} messages.
             * @param message FieldDescriptorProto message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IFieldDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a FieldDescriptorProto message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns FieldDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.FieldDescriptorProto;

            /**
             * Decodes a FieldDescriptorProto message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns FieldDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.FieldDescriptorProto;

            /**
             * Verifies a FieldDescriptorProto message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a FieldDescriptorProto message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns FieldDescriptorProto
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.FieldDescriptorProto;

            /**
             * Creates a plain object from a FieldDescriptorProto message. Also converts values to other types if specified.
             * @param message FieldDescriptorProto
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.FieldDescriptorProto, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this FieldDescriptorProto to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        namespace FieldDescriptorProto {

            /** Type enum. */
            enum Type {
                TYPE_DOUBLE = 1,
                TYPE_FLOAT = 2,
                TYPE_INT64 = 3,
                TYPE_UINT64 = 4,
                TYPE_INT32 = 5,
                TYPE_FIXED64 = 6,
                TYPE_FIXED32 = 7,
                TYPE_BOOL = 8,
                TYPE_STRING = 9,
                TYPE_GROUP = 10,
                TYPE_MESSAGE = 11,
                TYPE_BYTES = 12,
                TYPE_UINT32 = 13,
                TYPE_ENUM = 14,
                TYPE_SFIXED32 = 15,
                TYPE_SFIXED64 = 16,
                TYPE_SINT32 = 17,
                TYPE_SINT64 = 18
            }

            /** Label enum. */
            enum Label {
                LABEL_OPTIONAL = 1,
                LABEL_REQUIRED = 2,
                LABEL_REPEATED = 3
            }
        }

        /** Properties of an OneofDescriptorProto. */
        interface IOneofDescriptorProto {

            /** OneofDescriptorProto name */
            name?: (string|null);

            /** OneofDescriptorProto options */
            options?: (google.protobuf.IOneofOptions|null);
        }

        /** Represents an OneofDescriptorProto. */
        class OneofDescriptorProto implements IOneofDescriptorProto {

            /**
             * Constructs a new OneofDescriptorProto.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IOneofDescriptorProto);

            /** OneofDescriptorProto name. */
            public name: string;

            /** OneofDescriptorProto options. */
            public options?: (google.protobuf.IOneofOptions|null);

            /**
             * Creates a new OneofDescriptorProto instance using the specified properties.
             * @param [properties] Properties to set
             * @returns OneofDescriptorProto instance
             */
            public static create(properties?: google.protobuf.IOneofDescriptorProto): google.protobuf.OneofDescriptorProto;

            /**
             * Encodes the specified OneofDescriptorProto message. Does not implicitly {@link google.protobuf.OneofDescriptorProto.verify|verify} messages.
             * @param message OneofDescriptorProto message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IOneofDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified OneofDescriptorProto message, length delimited. Does not implicitly {@link google.protobuf.OneofDescriptorProto.verify|verify} messages.
             * @param message OneofDescriptorProto message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IOneofDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an OneofDescriptorProto message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns OneofDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.OneofDescriptorProto;

            /**
             * Decodes an OneofDescriptorProto message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns OneofDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.OneofDescriptorProto;

            /**
             * Verifies an OneofDescriptorProto message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an OneofDescriptorProto message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns OneofDescriptorProto
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.OneofDescriptorProto;

            /**
             * Creates a plain object from an OneofDescriptorProto message. Also converts values to other types if specified.
             * @param message OneofDescriptorProto
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.OneofDescriptorProto, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this OneofDescriptorProto to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of an EnumDescriptorProto. */
        interface IEnumDescriptorProto {

            /** EnumDescriptorProto name */
            name?: (string|null);

            /** EnumDescriptorProto value */
            value?: (google.protobuf.IEnumValueDescriptorProto[]|null);

            /** EnumDescriptorProto options */
            options?: (google.protobuf.IEnumOptions|null);

            /** EnumDescriptorProto reservedRange */
            reservedRange?: (google.protobuf.EnumDescriptorProto.IEnumReservedRange[]|null);

            /** EnumDescriptorProto reservedName */
            reservedName?: (string[]|null);
        }

        /** Represents an EnumDescriptorProto. */
        class EnumDescriptorProto implements IEnumDescriptorProto {

            /**
             * Constructs a new EnumDescriptorProto.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IEnumDescriptorProto);

            /** EnumDescriptorProto name. */
            public name: string;

            /** EnumDescriptorProto value. */
            public value: google.protobuf.IEnumValueDescriptorProto[];

            /** EnumDescriptorProto options. */
            public options?: (google.protobuf.IEnumOptions|null);

            /** EnumDescriptorProto reservedRange. */
            public reservedRange: google.protobuf.EnumDescriptorProto.IEnumReservedRange[];

            /** EnumDescriptorProto reservedName. */
            public reservedName: string[];

            /**
             * Creates a new EnumDescriptorProto instance using the specified properties.
             * @param [properties] Properties to set
             * @returns EnumDescriptorProto instance
             */
            public static create(properties?: google.protobuf.IEnumDescriptorProto): google.protobuf.EnumDescriptorProto;

            /**
             * Encodes the specified EnumDescriptorProto message. Does not implicitly {@link google.protobuf.EnumDescriptorProto.verify|verify} messages.
             * @param message EnumDescriptorProto message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IEnumDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified EnumDescriptorProto message, length delimited. Does not implicitly {@link google.protobuf.EnumDescriptorProto.verify|verify} messages.
             * @param message EnumDescriptorProto message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IEnumDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an EnumDescriptorProto message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns EnumDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.EnumDescriptorProto;

            /**
             * Decodes an EnumDescriptorProto message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns EnumDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.EnumDescriptorProto;

            /**
             * Verifies an EnumDescriptorProto message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an EnumDescriptorProto message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns EnumDescriptorProto
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.EnumDescriptorProto;

            /**
             * Creates a plain object from an EnumDescriptorProto message. Also converts values to other types if specified.
             * @param message EnumDescriptorProto
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.EnumDescriptorProto, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this EnumDescriptorProto to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        namespace EnumDescriptorProto {

            /** Properties of an EnumReservedRange. */
            interface IEnumReservedRange {

                /** EnumReservedRange start */
                start?: (number|null);

                /** EnumReservedRange end */
                end?: (number|null);
            }

            /** Represents an EnumReservedRange. */
            class EnumReservedRange implements IEnumReservedRange {

                /**
                 * Constructs a new EnumReservedRange.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.protobuf.EnumDescriptorProto.IEnumReservedRange);

                /** EnumReservedRange start. */
                public start: number;

                /** EnumReservedRange end. */
                public end: number;

                /**
                 * Creates a new EnumReservedRange instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns EnumReservedRange instance
                 */
                public static create(properties?: google.protobuf.EnumDescriptorProto.IEnumReservedRange): google.protobuf.EnumDescriptorProto.EnumReservedRange;

                /**
                 * Encodes the specified EnumReservedRange message. Does not implicitly {@link google.protobuf.EnumDescriptorProto.EnumReservedRange.verify|verify} messages.
                 * @param message EnumReservedRange message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.protobuf.EnumDescriptorProto.IEnumReservedRange, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified EnumReservedRange message, length delimited. Does not implicitly {@link google.protobuf.EnumDescriptorProto.EnumReservedRange.verify|verify} messages.
                 * @param message EnumReservedRange message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.protobuf.EnumDescriptorProto.IEnumReservedRange, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes an EnumReservedRange message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns EnumReservedRange
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.EnumDescriptorProto.EnumReservedRange;

                /**
                 * Decodes an EnumReservedRange message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns EnumReservedRange
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.EnumDescriptorProto.EnumReservedRange;

                /**
                 * Verifies an EnumReservedRange message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates an EnumReservedRange message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns EnumReservedRange
                 */
                public static fromObject(object: { [k: string]: any }): google.protobuf.EnumDescriptorProto.EnumReservedRange;

                /**
                 * Creates a plain object from an EnumReservedRange message. Also converts values to other types if specified.
                 * @param message EnumReservedRange
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.protobuf.EnumDescriptorProto.EnumReservedRange, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this EnumReservedRange to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }
        }

        /** Properties of an EnumValueDescriptorProto. */
        interface IEnumValueDescriptorProto {

            /** EnumValueDescriptorProto name */
            name?: (string|null);

            /** EnumValueDescriptorProto number */
            number?: (number|null);

            /** EnumValueDescriptorProto options */
            options?: (google.protobuf.IEnumValueOptions|null);
        }

        /** Represents an EnumValueDescriptorProto. */
        class EnumValueDescriptorProto implements IEnumValueDescriptorProto {

            /**
             * Constructs a new EnumValueDescriptorProto.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IEnumValueDescriptorProto);

            /** EnumValueDescriptorProto name. */
            public name: string;

            /** EnumValueDescriptorProto number. */
            public number: number;

            /** EnumValueDescriptorProto options. */
            public options?: (google.protobuf.IEnumValueOptions|null);

            /**
             * Creates a new EnumValueDescriptorProto instance using the specified properties.
             * @param [properties] Properties to set
             * @returns EnumValueDescriptorProto instance
             */
            public static create(properties?: google.protobuf.IEnumValueDescriptorProto): google.protobuf.EnumValueDescriptorProto;

            /**
             * Encodes the specified EnumValueDescriptorProto message. Does not implicitly {@link google.protobuf.EnumValueDescriptorProto.verify|verify} messages.
             * @param message EnumValueDescriptorProto message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IEnumValueDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified EnumValueDescriptorProto message, length delimited. Does not implicitly {@link google.protobuf.EnumValueDescriptorProto.verify|verify} messages.
             * @param message EnumValueDescriptorProto message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IEnumValueDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an EnumValueDescriptorProto message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns EnumValueDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.EnumValueDescriptorProto;

            /**
             * Decodes an EnumValueDescriptorProto message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns EnumValueDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.EnumValueDescriptorProto;

            /**
             * Verifies an EnumValueDescriptorProto message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an EnumValueDescriptorProto message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns EnumValueDescriptorProto
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.EnumValueDescriptorProto;

            /**
             * Creates a plain object from an EnumValueDescriptorProto message. Also converts values to other types if specified.
             * @param message EnumValueDescriptorProto
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.EnumValueDescriptorProto, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this EnumValueDescriptorProto to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a ServiceDescriptorProto. */
        interface IServiceDescriptorProto {

            /** ServiceDescriptorProto name */
            name?: (string|null);

            /** ServiceDescriptorProto method */
            method?: (google.protobuf.IMethodDescriptorProto[]|null);

            /** ServiceDescriptorProto options */
            options?: (google.protobuf.IServiceOptions|null);
        }

        /** Represents a ServiceDescriptorProto. */
        class ServiceDescriptorProto implements IServiceDescriptorProto {

            /**
             * Constructs a new ServiceDescriptorProto.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IServiceDescriptorProto);

            /** ServiceDescriptorProto name. */
            public name: string;

            /** ServiceDescriptorProto method. */
            public method: google.protobuf.IMethodDescriptorProto[];

            /** ServiceDescriptorProto options. */
            public options?: (google.protobuf.IServiceOptions|null);

            /**
             * Creates a new ServiceDescriptorProto instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ServiceDescriptorProto instance
             */
            public static create(properties?: google.protobuf.IServiceDescriptorProto): google.protobuf.ServiceDescriptorProto;

            /**
             * Encodes the specified ServiceDescriptorProto message. Does not implicitly {@link google.protobuf.ServiceDescriptorProto.verify|verify} messages.
             * @param message ServiceDescriptorProto message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IServiceDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ServiceDescriptorProto message, length delimited. Does not implicitly {@link google.protobuf.ServiceDescriptorProto.verify|verify} messages.
             * @param message ServiceDescriptorProto message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IServiceDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ServiceDescriptorProto message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ServiceDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.ServiceDescriptorProto;

            /**
             * Decodes a ServiceDescriptorProto message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ServiceDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.ServiceDescriptorProto;

            /**
             * Verifies a ServiceDescriptorProto message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ServiceDescriptorProto message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ServiceDescriptorProto
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.ServiceDescriptorProto;

            /**
             * Creates a plain object from a ServiceDescriptorProto message. Also converts values to other types if specified.
             * @param message ServiceDescriptorProto
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.ServiceDescriptorProto, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ServiceDescriptorProto to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a MethodDescriptorProto. */
        interface IMethodDescriptorProto {

            /** MethodDescriptorProto name */
            name?: (string|null);

            /** MethodDescriptorProto inputType */
            inputType?: (string|null);

            /** MethodDescriptorProto outputType */
            outputType?: (string|null);

            /** MethodDescriptorProto options */
            options?: (google.protobuf.IMethodOptions|null);

            /** MethodDescriptorProto clientStreaming */
            clientStreaming?: (boolean|null);

            /** MethodDescriptorProto serverStreaming */
            serverStreaming?: (boolean|null);
        }

        /** Represents a MethodDescriptorProto. */
        class MethodDescriptorProto implements IMethodDescriptorProto {

            /**
             * Constructs a new MethodDescriptorProto.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IMethodDescriptorProto);

            /** MethodDescriptorProto name. */
            public name: string;

            /** MethodDescriptorProto inputType. */
            public inputType: string;

            /** MethodDescriptorProto outputType. */
            public outputType: string;

            /** MethodDescriptorProto options. */
            public options?: (google.protobuf.IMethodOptions|null);

            /** MethodDescriptorProto clientStreaming. */
            public clientStreaming: boolean;

            /** MethodDescriptorProto serverStreaming. */
            public serverStreaming: boolean;

            /**
             * Creates a new MethodDescriptorProto instance using the specified properties.
             * @param [properties] Properties to set
             * @returns MethodDescriptorProto instance
             */
            public static create(properties?: google.protobuf.IMethodDescriptorProto): google.protobuf.MethodDescriptorProto;

            /**
             * Encodes the specified MethodDescriptorProto message. Does not implicitly {@link google.protobuf.MethodDescriptorProto.verify|verify} messages.
             * @param message MethodDescriptorProto message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IMethodDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified MethodDescriptorProto message, length delimited. Does not implicitly {@link google.protobuf.MethodDescriptorProto.verify|verify} messages.
             * @param message MethodDescriptorProto message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IMethodDescriptorProto, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a MethodDescriptorProto message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns MethodDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.MethodDescriptorProto;

            /**
             * Decodes a MethodDescriptorProto message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns MethodDescriptorProto
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.MethodDescriptorProto;

            /**
             * Verifies a MethodDescriptorProto message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a MethodDescriptorProto message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns MethodDescriptorProto
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.MethodDescriptorProto;

            /**
             * Creates a plain object from a MethodDescriptorProto message. Also converts values to other types if specified.
             * @param message MethodDescriptorProto
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.MethodDescriptorProto, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this MethodDescriptorProto to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a FileOptions. */
        interface IFileOptions {

            /** FileOptions javaPackage */
            javaPackage?: (string|null);

            /** FileOptions javaOuterClassname */
            javaOuterClassname?: (string|null);

            /** FileOptions javaMultipleFiles */
            javaMultipleFiles?: (boolean|null);

            /** FileOptions javaGenerateEqualsAndHash */
            javaGenerateEqualsAndHash?: (boolean|null);

            /** FileOptions javaStringCheckUtf8 */
            javaStringCheckUtf8?: (boolean|null);

            /** FileOptions optimizeFor */
            optimizeFor?: (google.protobuf.FileOptions.OptimizeMode|keyof typeof google.protobuf.FileOptions.OptimizeMode|null);

            /** FileOptions goPackage */
            goPackage?: (string|null);

            /** FileOptions ccGenericServices */
            ccGenericServices?: (boolean|null);

            /** FileOptions javaGenericServices */
            javaGenericServices?: (boolean|null);

            /** FileOptions pyGenericServices */
            pyGenericServices?: (boolean|null);

            /** FileOptions phpGenericServices */
            phpGenericServices?: (boolean|null);

            /** FileOptions deprecated */
            deprecated?: (boolean|null);

            /** FileOptions ccEnableArenas */
            ccEnableArenas?: (boolean|null);

            /** FileOptions objcClassPrefix */
            objcClassPrefix?: (string|null);

            /** FileOptions csharpNamespace */
            csharpNamespace?: (string|null);

            /** FileOptions swiftPrefix */
            swiftPrefix?: (string|null);

            /** FileOptions phpClassPrefix */
            phpClassPrefix?: (string|null);

            /** FileOptions phpNamespace */
            phpNamespace?: (string|null);

            /** FileOptions phpMetadataNamespace */
            phpMetadataNamespace?: (string|null);

            /** FileOptions rubyPackage */
            rubyPackage?: (string|null);

            /** FileOptions uninterpretedOption */
            uninterpretedOption?: (google.protobuf.IUninterpretedOption[]|null);

            /** FileOptions .google.api.resourceDefinition */
            ".google.api.resourceDefinition"?: (google.api.IResourceDescriptor[]|null);
        }

        /** Represents a FileOptions. */
        class FileOptions implements IFileOptions {

            /**
             * Constructs a new FileOptions.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IFileOptions);

            /** FileOptions javaPackage. */
            public javaPackage: string;

            /** FileOptions javaOuterClassname. */
            public javaOuterClassname: string;

            /** FileOptions javaMultipleFiles. */
            public javaMultipleFiles: boolean;

            /** FileOptions javaGenerateEqualsAndHash. */
            public javaGenerateEqualsAndHash: boolean;

            /** FileOptions javaStringCheckUtf8. */
            public javaStringCheckUtf8: boolean;

            /** FileOptions optimizeFor. */
            public optimizeFor: (google.protobuf.FileOptions.OptimizeMode|keyof typeof google.protobuf.FileOptions.OptimizeMode);

            /** FileOptions goPackage. */
            public goPackage: string;

            /** FileOptions ccGenericServices. */
            public ccGenericServices: boolean;

            /** FileOptions javaGenericServices. */
            public javaGenericServices: boolean;

            /** FileOptions pyGenericServices. */
            public pyGenericServices: boolean;

            /** FileOptions phpGenericServices. */
            public phpGenericServices: boolean;

            /** FileOptions deprecated. */
            public deprecated: boolean;

            /** FileOptions ccEnableArenas. */
            public ccEnableArenas: boolean;

            /** FileOptions objcClassPrefix. */
            public objcClassPrefix: string;

            /** FileOptions csharpNamespace. */
            public csharpNamespace: string;

            /** FileOptions swiftPrefix. */
            public swiftPrefix: string;

            /** FileOptions phpClassPrefix. */
            public phpClassPrefix: string;

            /** FileOptions phpNamespace. */
            public phpNamespace: string;

            /** FileOptions phpMetadataNamespace. */
            public phpMetadataNamespace: string;

            /** FileOptions rubyPackage. */
            public rubyPackage: string;

            /** FileOptions uninterpretedOption. */
            public uninterpretedOption: google.protobuf.IUninterpretedOption[];

            /**
             * Creates a new FileOptions instance using the specified properties.
             * @param [properties] Properties to set
             * @returns FileOptions instance
             */
            public static create(properties?: google.protobuf.IFileOptions): google.protobuf.FileOptions;

            /**
             * Encodes the specified FileOptions message. Does not implicitly {@link google.protobuf.FileOptions.verify|verify} messages.
             * @param message FileOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IFileOptions, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified FileOptions message, length delimited. Does not implicitly {@link google.protobuf.FileOptions.verify|verify} messages.
             * @param message FileOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IFileOptions, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a FileOptions message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns FileOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.FileOptions;

            /**
             * Decodes a FileOptions message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns FileOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.FileOptions;

            /**
             * Verifies a FileOptions message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a FileOptions message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns FileOptions
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.FileOptions;

            /**
             * Creates a plain object from a FileOptions message. Also converts values to other types if specified.
             * @param message FileOptions
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.FileOptions, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this FileOptions to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        namespace FileOptions {

            /** OptimizeMode enum. */
            enum OptimizeMode {
                SPEED = 1,
                CODE_SIZE = 2,
                LITE_RUNTIME = 3
            }
        }

        /** Properties of a MessageOptions. */
        interface IMessageOptions {

            /** MessageOptions messageSetWireFormat */
            messageSetWireFormat?: (boolean|null);

            /** MessageOptions noStandardDescriptorAccessor */
            noStandardDescriptorAccessor?: (boolean|null);

            /** MessageOptions deprecated */
            deprecated?: (boolean|null);

            /** MessageOptions mapEntry */
            mapEntry?: (boolean|null);

            /** MessageOptions uninterpretedOption */
            uninterpretedOption?: (google.protobuf.IUninterpretedOption[]|null);

            /** MessageOptions .google.api.resource */
            ".google.api.resource"?: (google.api.IResourceDescriptor|null);
        }

        /** Represents a MessageOptions. */
        class MessageOptions implements IMessageOptions {

            /**
             * Constructs a new MessageOptions.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IMessageOptions);

            /** MessageOptions messageSetWireFormat. */
            public messageSetWireFormat: boolean;

            /** MessageOptions noStandardDescriptorAccessor. */
            public noStandardDescriptorAccessor: boolean;

            /** MessageOptions deprecated. */
            public deprecated: boolean;

            /** MessageOptions mapEntry. */
            public mapEntry: boolean;

            /** MessageOptions uninterpretedOption. */
            public uninterpretedOption: google.protobuf.IUninterpretedOption[];

            /**
             * Creates a new MessageOptions instance using the specified properties.
             * @param [properties] Properties to set
             * @returns MessageOptions instance
             */
            public static create(properties?: google.protobuf.IMessageOptions): google.protobuf.MessageOptions;

            /**
             * Encodes the specified MessageOptions message. Does not implicitly {@link google.protobuf.MessageOptions.verify|verify} messages.
             * @param message MessageOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IMessageOptions, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified MessageOptions message, length delimited. Does not implicitly {@link google.protobuf.MessageOptions.verify|verify} messages.
             * @param message MessageOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IMessageOptions, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a MessageOptions message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns MessageOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.MessageOptions;

            /**
             * Decodes a MessageOptions message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns MessageOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.MessageOptions;

            /**
             * Verifies a MessageOptions message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a MessageOptions message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns MessageOptions
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.MessageOptions;

            /**
             * Creates a plain object from a MessageOptions message. Also converts values to other types if specified.
             * @param message MessageOptions
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.MessageOptions, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this MessageOptions to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a FieldOptions. */
        interface IFieldOptions {

            /** FieldOptions ctype */
            ctype?: (google.protobuf.FieldOptions.CType|keyof typeof google.protobuf.FieldOptions.CType|null);

            /** FieldOptions packed */
            packed?: (boolean|null);

            /** FieldOptions jstype */
            jstype?: (google.protobuf.FieldOptions.JSType|keyof typeof google.protobuf.FieldOptions.JSType|null);

            /** FieldOptions lazy */
            lazy?: (boolean|null);

            /** FieldOptions deprecated */
            deprecated?: (boolean|null);

            /** FieldOptions weak */
            weak?: (boolean|null);

            /** FieldOptions uninterpretedOption */
            uninterpretedOption?: (google.protobuf.IUninterpretedOption[]|null);

            /** FieldOptions .google.api.fieldBehavior */
            ".google.api.fieldBehavior"?: (google.api.FieldBehavior[]|null);

            /** FieldOptions .google.api.resourceReference */
            ".google.api.resourceReference"?: (google.api.IResourceReference|null);
        }

        /** Represents a FieldOptions. */
        class FieldOptions implements IFieldOptions {

            /**
             * Constructs a new FieldOptions.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IFieldOptions);

            /** FieldOptions ctype. */
            public ctype: (google.protobuf.FieldOptions.CType|keyof typeof google.protobuf.FieldOptions.CType);

            /** FieldOptions packed. */
            public packed: boolean;

            /** FieldOptions jstype. */
            public jstype: (google.protobuf.FieldOptions.JSType|keyof typeof google.protobuf.FieldOptions.JSType);

            /** FieldOptions lazy. */
            public lazy: boolean;

            /** FieldOptions deprecated. */
            public deprecated: boolean;

            /** FieldOptions weak. */
            public weak: boolean;

            /** FieldOptions uninterpretedOption. */
            public uninterpretedOption: google.protobuf.IUninterpretedOption[];

            /**
             * Creates a new FieldOptions instance using the specified properties.
             * @param [properties] Properties to set
             * @returns FieldOptions instance
             */
            public static create(properties?: google.protobuf.IFieldOptions): google.protobuf.FieldOptions;

            /**
             * Encodes the specified FieldOptions message. Does not implicitly {@link google.protobuf.FieldOptions.verify|verify} messages.
             * @param message FieldOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IFieldOptions, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified FieldOptions message, length delimited. Does not implicitly {@link google.protobuf.FieldOptions.verify|verify} messages.
             * @param message FieldOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IFieldOptions, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a FieldOptions message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns FieldOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.FieldOptions;

            /**
             * Decodes a FieldOptions message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns FieldOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.FieldOptions;

            /**
             * Verifies a FieldOptions message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a FieldOptions message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns FieldOptions
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.FieldOptions;

            /**
             * Creates a plain object from a FieldOptions message. Also converts values to other types if specified.
             * @param message FieldOptions
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.FieldOptions, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this FieldOptions to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        namespace FieldOptions {

            /** CType enum. */
            enum CType {
                STRING = 0,
                CORD = 1,
                STRING_PIECE = 2
            }

            /** JSType enum. */
            enum JSType {
                JS_NORMAL = 0,
                JS_STRING = 1,
                JS_NUMBER = 2
            }
        }

        /** Properties of an OneofOptions. */
        interface IOneofOptions {

            /** OneofOptions uninterpretedOption */
            uninterpretedOption?: (google.protobuf.IUninterpretedOption[]|null);
        }

        /** Represents an OneofOptions. */
        class OneofOptions implements IOneofOptions {

            /**
             * Constructs a new OneofOptions.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IOneofOptions);

            /** OneofOptions uninterpretedOption. */
            public uninterpretedOption: google.protobuf.IUninterpretedOption[];

            /**
             * Creates a new OneofOptions instance using the specified properties.
             * @param [properties] Properties to set
             * @returns OneofOptions instance
             */
            public static create(properties?: google.protobuf.IOneofOptions): google.protobuf.OneofOptions;

            /**
             * Encodes the specified OneofOptions message. Does not implicitly {@link google.protobuf.OneofOptions.verify|verify} messages.
             * @param message OneofOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IOneofOptions, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified OneofOptions message, length delimited. Does not implicitly {@link google.protobuf.OneofOptions.verify|verify} messages.
             * @param message OneofOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IOneofOptions, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an OneofOptions message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns OneofOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.OneofOptions;

            /**
             * Decodes an OneofOptions message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns OneofOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.OneofOptions;

            /**
             * Verifies an OneofOptions message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an OneofOptions message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns OneofOptions
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.OneofOptions;

            /**
             * Creates a plain object from an OneofOptions message. Also converts values to other types if specified.
             * @param message OneofOptions
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.OneofOptions, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this OneofOptions to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of an EnumOptions. */
        interface IEnumOptions {

            /** EnumOptions allowAlias */
            allowAlias?: (boolean|null);

            /** EnumOptions deprecated */
            deprecated?: (boolean|null);

            /** EnumOptions uninterpretedOption */
            uninterpretedOption?: (google.protobuf.IUninterpretedOption[]|null);
        }

        /** Represents an EnumOptions. */
        class EnumOptions implements IEnumOptions {

            /**
             * Constructs a new EnumOptions.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IEnumOptions);

            /** EnumOptions allowAlias. */
            public allowAlias: boolean;

            /** EnumOptions deprecated. */
            public deprecated: boolean;

            /** EnumOptions uninterpretedOption. */
            public uninterpretedOption: google.protobuf.IUninterpretedOption[];

            /**
             * Creates a new EnumOptions instance using the specified properties.
             * @param [properties] Properties to set
             * @returns EnumOptions instance
             */
            public static create(properties?: google.protobuf.IEnumOptions): google.protobuf.EnumOptions;

            /**
             * Encodes the specified EnumOptions message. Does not implicitly {@link google.protobuf.EnumOptions.verify|verify} messages.
             * @param message EnumOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IEnumOptions, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified EnumOptions message, length delimited. Does not implicitly {@link google.protobuf.EnumOptions.verify|verify} messages.
             * @param message EnumOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IEnumOptions, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an EnumOptions message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns EnumOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.EnumOptions;

            /**
             * Decodes an EnumOptions message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns EnumOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.EnumOptions;

            /**
             * Verifies an EnumOptions message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an EnumOptions message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns EnumOptions
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.EnumOptions;

            /**
             * Creates a plain object from an EnumOptions message. Also converts values to other types if specified.
             * @param message EnumOptions
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.EnumOptions, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this EnumOptions to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of an EnumValueOptions. */
        interface IEnumValueOptions {

            /** EnumValueOptions deprecated */
            deprecated?: (boolean|null);

            /** EnumValueOptions uninterpretedOption */
            uninterpretedOption?: (google.protobuf.IUninterpretedOption[]|null);
        }

        /** Represents an EnumValueOptions. */
        class EnumValueOptions implements IEnumValueOptions {

            /**
             * Constructs a new EnumValueOptions.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IEnumValueOptions);

            /** EnumValueOptions deprecated. */
            public deprecated: boolean;

            /** EnumValueOptions uninterpretedOption. */
            public uninterpretedOption: google.protobuf.IUninterpretedOption[];

            /**
             * Creates a new EnumValueOptions instance using the specified properties.
             * @param [properties] Properties to set
             * @returns EnumValueOptions instance
             */
            public static create(properties?: google.protobuf.IEnumValueOptions): google.protobuf.EnumValueOptions;

            /**
             * Encodes the specified EnumValueOptions message. Does not implicitly {@link google.protobuf.EnumValueOptions.verify|verify} messages.
             * @param message EnumValueOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IEnumValueOptions, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified EnumValueOptions message, length delimited. Does not implicitly {@link google.protobuf.EnumValueOptions.verify|verify} messages.
             * @param message EnumValueOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IEnumValueOptions, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an EnumValueOptions message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns EnumValueOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.EnumValueOptions;

            /**
             * Decodes an EnumValueOptions message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns EnumValueOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.EnumValueOptions;

            /**
             * Verifies an EnumValueOptions message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an EnumValueOptions message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns EnumValueOptions
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.EnumValueOptions;

            /**
             * Creates a plain object from an EnumValueOptions message. Also converts values to other types if specified.
             * @param message EnumValueOptions
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.EnumValueOptions, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this EnumValueOptions to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a ServiceOptions. */
        interface IServiceOptions {

            /** ServiceOptions deprecated */
            deprecated?: (boolean|null);

            /** ServiceOptions uninterpretedOption */
            uninterpretedOption?: (google.protobuf.IUninterpretedOption[]|null);

            /** ServiceOptions .google.api.defaultHost */
            ".google.api.defaultHost"?: (string|null);

            /** ServiceOptions .google.api.oauthScopes */
            ".google.api.oauthScopes"?: (string|null);
        }

        /** Represents a ServiceOptions. */
        class ServiceOptions implements IServiceOptions {

            /**
             * Constructs a new ServiceOptions.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IServiceOptions);

            /** ServiceOptions deprecated. */
            public deprecated: boolean;

            /** ServiceOptions uninterpretedOption. */
            public uninterpretedOption: google.protobuf.IUninterpretedOption[];

            /**
             * Creates a new ServiceOptions instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ServiceOptions instance
             */
            public static create(properties?: google.protobuf.IServiceOptions): google.protobuf.ServiceOptions;

            /**
             * Encodes the specified ServiceOptions message. Does not implicitly {@link google.protobuf.ServiceOptions.verify|verify} messages.
             * @param message ServiceOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IServiceOptions, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ServiceOptions message, length delimited. Does not implicitly {@link google.protobuf.ServiceOptions.verify|verify} messages.
             * @param message ServiceOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IServiceOptions, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ServiceOptions message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ServiceOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.ServiceOptions;

            /**
             * Decodes a ServiceOptions message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ServiceOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.ServiceOptions;

            /**
             * Verifies a ServiceOptions message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ServiceOptions message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ServiceOptions
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.ServiceOptions;

            /**
             * Creates a plain object from a ServiceOptions message. Also converts values to other types if specified.
             * @param message ServiceOptions
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.ServiceOptions, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ServiceOptions to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a MethodOptions. */
        interface IMethodOptions {

            /** MethodOptions deprecated */
            deprecated?: (boolean|null);

            /** MethodOptions idempotencyLevel */
            idempotencyLevel?: (google.protobuf.MethodOptions.IdempotencyLevel|keyof typeof google.protobuf.MethodOptions.IdempotencyLevel|null);

            /** MethodOptions uninterpretedOption */
            uninterpretedOption?: (google.protobuf.IUninterpretedOption[]|null);

            /** MethodOptions .google.api.http */
            ".google.api.http"?: (google.api.IHttpRule|null);

            /** MethodOptions .google.api.methodSignature */
            ".google.api.methodSignature"?: (string[]|null);

            /** MethodOptions .google.longrunning.operationInfo */
            ".google.longrunning.operationInfo"?: (google.longrunning.IOperationInfo|null);
        }

        /** Represents a MethodOptions. */
        class MethodOptions implements IMethodOptions {

            /**
             * Constructs a new MethodOptions.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IMethodOptions);

            /** MethodOptions deprecated. */
            public deprecated: boolean;

            /** MethodOptions idempotencyLevel. */
            public idempotencyLevel: (google.protobuf.MethodOptions.IdempotencyLevel|keyof typeof google.protobuf.MethodOptions.IdempotencyLevel);

            /** MethodOptions uninterpretedOption. */
            public uninterpretedOption: google.protobuf.IUninterpretedOption[];

            /**
             * Creates a new MethodOptions instance using the specified properties.
             * @param [properties] Properties to set
             * @returns MethodOptions instance
             */
            public static create(properties?: google.protobuf.IMethodOptions): google.protobuf.MethodOptions;

            /**
             * Encodes the specified MethodOptions message. Does not implicitly {@link google.protobuf.MethodOptions.verify|verify} messages.
             * @param message MethodOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IMethodOptions, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified MethodOptions message, length delimited. Does not implicitly {@link google.protobuf.MethodOptions.verify|verify} messages.
             * @param message MethodOptions message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IMethodOptions, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a MethodOptions message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns MethodOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.MethodOptions;

            /**
             * Decodes a MethodOptions message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns MethodOptions
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.MethodOptions;

            /**
             * Verifies a MethodOptions message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a MethodOptions message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns MethodOptions
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.MethodOptions;

            /**
             * Creates a plain object from a MethodOptions message. Also converts values to other types if specified.
             * @param message MethodOptions
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.MethodOptions, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this MethodOptions to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        namespace MethodOptions {

            /** IdempotencyLevel enum. */
            enum IdempotencyLevel {
                IDEMPOTENCY_UNKNOWN = 0,
                NO_SIDE_EFFECTS = 1,
                IDEMPOTENT = 2
            }
        }

        /** Properties of an UninterpretedOption. */
        interface IUninterpretedOption {

            /** UninterpretedOption name */
            name?: (google.protobuf.UninterpretedOption.INamePart[]|null);

            /** UninterpretedOption identifierValue */
            identifierValue?: (string|null);

            /** UninterpretedOption positiveIntValue */
            positiveIntValue?: (number|Long|string|null);

            /** UninterpretedOption negativeIntValue */
            negativeIntValue?: (number|Long|string|null);

            /** UninterpretedOption doubleValue */
            doubleValue?: (number|null);

            /** UninterpretedOption stringValue */
            stringValue?: (Uint8Array|string|null);

            /** UninterpretedOption aggregateValue */
            aggregateValue?: (string|null);
        }

        /** Represents an UninterpretedOption. */
        class UninterpretedOption implements IUninterpretedOption {

            /**
             * Constructs a new UninterpretedOption.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IUninterpretedOption);

            /** UninterpretedOption name. */
            public name: google.protobuf.UninterpretedOption.INamePart[];

            /** UninterpretedOption identifierValue. */
            public identifierValue: string;

            /** UninterpretedOption positiveIntValue. */
            public positiveIntValue: (number|Long|string);

            /** UninterpretedOption negativeIntValue. */
            public negativeIntValue: (number|Long|string);

            /** UninterpretedOption doubleValue. */
            public doubleValue: number;

            /** UninterpretedOption stringValue. */
            public stringValue: (Uint8Array|string);

            /** UninterpretedOption aggregateValue. */
            public aggregateValue: string;

            /**
             * Creates a new UninterpretedOption instance using the specified properties.
             * @param [properties] Properties to set
             * @returns UninterpretedOption instance
             */
            public static create(properties?: google.protobuf.IUninterpretedOption): google.protobuf.UninterpretedOption;

            /**
             * Encodes the specified UninterpretedOption message. Does not implicitly {@link google.protobuf.UninterpretedOption.verify|verify} messages.
             * @param message UninterpretedOption message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IUninterpretedOption, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified UninterpretedOption message, length delimited. Does not implicitly {@link google.protobuf.UninterpretedOption.verify|verify} messages.
             * @param message UninterpretedOption message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IUninterpretedOption, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an UninterpretedOption message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns UninterpretedOption
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.UninterpretedOption;

            /**
             * Decodes an UninterpretedOption message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns UninterpretedOption
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.UninterpretedOption;

            /**
             * Verifies an UninterpretedOption message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an UninterpretedOption message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns UninterpretedOption
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.UninterpretedOption;

            /**
             * Creates a plain object from an UninterpretedOption message. Also converts values to other types if specified.
             * @param message UninterpretedOption
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.UninterpretedOption, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this UninterpretedOption to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        namespace UninterpretedOption {

            /** Properties of a NamePart. */
            interface INamePart {

                /** NamePart namePart */
                namePart: string;

                /** NamePart isExtension */
                isExtension: boolean;
            }

            /** Represents a NamePart. */
            class NamePart implements INamePart {

                /**
                 * Constructs a new NamePart.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.protobuf.UninterpretedOption.INamePart);

                /** NamePart namePart. */
                public namePart: string;

                /** NamePart isExtension. */
                public isExtension: boolean;

                /**
                 * Creates a new NamePart instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns NamePart instance
                 */
                public static create(properties?: google.protobuf.UninterpretedOption.INamePart): google.protobuf.UninterpretedOption.NamePart;

                /**
                 * Encodes the specified NamePart message. Does not implicitly {@link google.protobuf.UninterpretedOption.NamePart.verify|verify} messages.
                 * @param message NamePart message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.protobuf.UninterpretedOption.INamePart, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified NamePart message, length delimited. Does not implicitly {@link google.protobuf.UninterpretedOption.NamePart.verify|verify} messages.
                 * @param message NamePart message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.protobuf.UninterpretedOption.INamePart, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a NamePart message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns NamePart
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.UninterpretedOption.NamePart;

                /**
                 * Decodes a NamePart message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns NamePart
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.UninterpretedOption.NamePart;

                /**
                 * Verifies a NamePart message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a NamePart message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns NamePart
                 */
                public static fromObject(object: { [k: string]: any }): google.protobuf.UninterpretedOption.NamePart;

                /**
                 * Creates a plain object from a NamePart message. Also converts values to other types if specified.
                 * @param message NamePart
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.protobuf.UninterpretedOption.NamePart, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this NamePart to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }
        }

        /** Properties of a SourceCodeInfo. */
        interface ISourceCodeInfo {

            /** SourceCodeInfo location */
            location?: (google.protobuf.SourceCodeInfo.ILocation[]|null);
        }

        /** Represents a SourceCodeInfo. */
        class SourceCodeInfo implements ISourceCodeInfo {

            /**
             * Constructs a new SourceCodeInfo.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.ISourceCodeInfo);

            /** SourceCodeInfo location. */
            public location: google.protobuf.SourceCodeInfo.ILocation[];

            /**
             * Creates a new SourceCodeInfo instance using the specified properties.
             * @param [properties] Properties to set
             * @returns SourceCodeInfo instance
             */
            public static create(properties?: google.protobuf.ISourceCodeInfo): google.protobuf.SourceCodeInfo;

            /**
             * Encodes the specified SourceCodeInfo message. Does not implicitly {@link google.protobuf.SourceCodeInfo.verify|verify} messages.
             * @param message SourceCodeInfo message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.ISourceCodeInfo, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified SourceCodeInfo message, length delimited. Does not implicitly {@link google.protobuf.SourceCodeInfo.verify|verify} messages.
             * @param message SourceCodeInfo message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.ISourceCodeInfo, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a SourceCodeInfo message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns SourceCodeInfo
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.SourceCodeInfo;

            /**
             * Decodes a SourceCodeInfo message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns SourceCodeInfo
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.SourceCodeInfo;

            /**
             * Verifies a SourceCodeInfo message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a SourceCodeInfo message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns SourceCodeInfo
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.SourceCodeInfo;

            /**
             * Creates a plain object from a SourceCodeInfo message. Also converts values to other types if specified.
             * @param message SourceCodeInfo
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.SourceCodeInfo, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this SourceCodeInfo to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        namespace SourceCodeInfo {

            /** Properties of a Location. */
            interface ILocation {

                /** Location path */
                path?: (number[]|null);

                /** Location span */
                span?: (number[]|null);

                /** Location leadingComments */
                leadingComments?: (string|null);

                /** Location trailingComments */
                trailingComments?: (string|null);

                /** Location leadingDetachedComments */
                leadingDetachedComments?: (string[]|null);
            }

            /** Represents a Location. */
            class Location implements ILocation {

                /**
                 * Constructs a new Location.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.protobuf.SourceCodeInfo.ILocation);

                /** Location path. */
                public path: number[];

                /** Location span. */
                public span: number[];

                /** Location leadingComments. */
                public leadingComments: string;

                /** Location trailingComments. */
                public trailingComments: string;

                /** Location leadingDetachedComments. */
                public leadingDetachedComments: string[];

                /**
                 * Creates a new Location instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns Location instance
                 */
                public static create(properties?: google.protobuf.SourceCodeInfo.ILocation): google.protobuf.SourceCodeInfo.Location;

                /**
                 * Encodes the specified Location message. Does not implicitly {@link google.protobuf.SourceCodeInfo.Location.verify|verify} messages.
                 * @param message Location message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.protobuf.SourceCodeInfo.ILocation, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified Location message, length delimited. Does not implicitly {@link google.protobuf.SourceCodeInfo.Location.verify|verify} messages.
                 * @param message Location message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.protobuf.SourceCodeInfo.ILocation, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a Location message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns Location
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.SourceCodeInfo.Location;

                /**
                 * Decodes a Location message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns Location
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.SourceCodeInfo.Location;

                /**
                 * Verifies a Location message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a Location message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns Location
                 */
                public static fromObject(object: { [k: string]: any }): google.protobuf.SourceCodeInfo.Location;

                /**
                 * Creates a plain object from a Location message. Also converts values to other types if specified.
                 * @param message Location
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.protobuf.SourceCodeInfo.Location, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this Location to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }
        }

        /** Properties of a GeneratedCodeInfo. */
        interface IGeneratedCodeInfo {

            /** GeneratedCodeInfo annotation */
            annotation?: (google.protobuf.GeneratedCodeInfo.IAnnotation[]|null);
        }

        /** Represents a GeneratedCodeInfo. */
        class GeneratedCodeInfo implements IGeneratedCodeInfo {

            /**
             * Constructs a new GeneratedCodeInfo.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IGeneratedCodeInfo);

            /** GeneratedCodeInfo annotation. */
            public annotation: google.protobuf.GeneratedCodeInfo.IAnnotation[];

            /**
             * Creates a new GeneratedCodeInfo instance using the specified properties.
             * @param [properties] Properties to set
             * @returns GeneratedCodeInfo instance
             */
            public static create(properties?: google.protobuf.IGeneratedCodeInfo): google.protobuf.GeneratedCodeInfo;

            /**
             * Encodes the specified GeneratedCodeInfo message. Does not implicitly {@link google.protobuf.GeneratedCodeInfo.verify|verify} messages.
             * @param message GeneratedCodeInfo message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IGeneratedCodeInfo, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified GeneratedCodeInfo message, length delimited. Does not implicitly {@link google.protobuf.GeneratedCodeInfo.verify|verify} messages.
             * @param message GeneratedCodeInfo message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IGeneratedCodeInfo, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a GeneratedCodeInfo message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns GeneratedCodeInfo
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.GeneratedCodeInfo;

            /**
             * Decodes a GeneratedCodeInfo message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns GeneratedCodeInfo
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.GeneratedCodeInfo;

            /**
             * Verifies a GeneratedCodeInfo message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a GeneratedCodeInfo message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns GeneratedCodeInfo
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.GeneratedCodeInfo;

            /**
             * Creates a plain object from a GeneratedCodeInfo message. Also converts values to other types if specified.
             * @param message GeneratedCodeInfo
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.GeneratedCodeInfo, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this GeneratedCodeInfo to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        namespace GeneratedCodeInfo {

            /** Properties of an Annotation. */
            interface IAnnotation {

                /** Annotation path */
                path?: (number[]|null);

                /** Annotation sourceFile */
                sourceFile?: (string|null);

                /** Annotation begin */
                begin?: (number|null);

                /** Annotation end */
                end?: (number|null);
            }

            /** Represents an Annotation. */
            class Annotation implements IAnnotation {

                /**
                 * Constructs a new Annotation.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.protobuf.GeneratedCodeInfo.IAnnotation);

                /** Annotation path. */
                public path: number[];

                /** Annotation sourceFile. */
                public sourceFile: string;

                /** Annotation begin. */
                public begin: number;

                /** Annotation end. */
                public end: number;

                /**
                 * Creates a new Annotation instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns Annotation instance
                 */
                public static create(properties?: google.protobuf.GeneratedCodeInfo.IAnnotation): google.protobuf.GeneratedCodeInfo.Annotation;

                /**
                 * Encodes the specified Annotation message. Does not implicitly {@link google.protobuf.GeneratedCodeInfo.Annotation.verify|verify} messages.
                 * @param message Annotation message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.protobuf.GeneratedCodeInfo.IAnnotation, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified Annotation message, length delimited. Does not implicitly {@link google.protobuf.GeneratedCodeInfo.Annotation.verify|verify} messages.
                 * @param message Annotation message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.protobuf.GeneratedCodeInfo.IAnnotation, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes an Annotation message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns Annotation
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.GeneratedCodeInfo.Annotation;

                /**
                 * Decodes an Annotation message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns Annotation
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.GeneratedCodeInfo.Annotation;

                /**
                 * Verifies an Annotation message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates an Annotation message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns Annotation
                 */
                public static fromObject(object: { [k: string]: any }): google.protobuf.GeneratedCodeInfo.Annotation;

                /**
                 * Creates a plain object from an Annotation message. Also converts values to other types if specified.
                 * @param message Annotation
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.protobuf.GeneratedCodeInfo.Annotation, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this Annotation to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }
        }

        /** Properties of an Any. */
        interface IAny {

            /** Any type_url */
            type_url?: (string|null);

            /** Any value */
            value?: (Uint8Array|string|null);
        }

        /** Represents an Any. */
        class Any implements IAny {

            /**
             * Constructs a new Any.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IAny);

            /** Any type_url. */
            public type_url: string;

            /** Any value. */
            public value: (Uint8Array|string);

            /**
             * Creates a new Any instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Any instance
             */
            public static create(properties?: google.protobuf.IAny): google.protobuf.Any;

            /**
             * Encodes the specified Any message. Does not implicitly {@link google.protobuf.Any.verify|verify} messages.
             * @param message Any message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IAny, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Any message, length delimited. Does not implicitly {@link google.protobuf.Any.verify|verify} messages.
             * @param message Any message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IAny, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an Any message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Any
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.Any;

            /**
             * Decodes an Any message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Any
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.Any;

            /**
             * Verifies an Any message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an Any message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Any
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.Any;

            /**
             * Creates a plain object from an Any message. Also converts values to other types if specified.
             * @param message Any
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.Any, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Any to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of an Empty. */
        interface IEmpty {
        }

        /** Represents an Empty. */
        class Empty implements IEmpty {

            /**
             * Constructs a new Empty.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IEmpty);

            /**
             * Creates a new Empty instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Empty instance
             */
            public static create(properties?: google.protobuf.IEmpty): google.protobuf.Empty;

            /**
             * Encodes the specified Empty message. Does not implicitly {@link google.protobuf.Empty.verify|verify} messages.
             * @param message Empty message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IEmpty, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Empty message, length delimited. Does not implicitly {@link google.protobuf.Empty.verify|verify} messages.
             * @param message Empty message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IEmpty, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an Empty message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Empty
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.Empty;

            /**
             * Decodes an Empty message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Empty
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.Empty;

            /**
             * Verifies an Empty message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an Empty message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Empty
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.Empty;

            /**
             * Creates a plain object from an Empty message. Also converts values to other types if specified.
             * @param message Empty
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.Empty, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Empty to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a FieldMask. */
        interface IFieldMask {

            /** FieldMask paths */
            paths?: (string[]|null);
        }

        /** Represents a FieldMask. */
        class FieldMask implements IFieldMask {

            /**
             * Constructs a new FieldMask.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IFieldMask);

            /** FieldMask paths. */
            public paths: string[];

            /**
             * Creates a new FieldMask instance using the specified properties.
             * @param [properties] Properties to set
             * @returns FieldMask instance
             */
            public static create(properties?: google.protobuf.IFieldMask): google.protobuf.FieldMask;

            /**
             * Encodes the specified FieldMask message. Does not implicitly {@link google.protobuf.FieldMask.verify|verify} messages.
             * @param message FieldMask message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IFieldMask, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified FieldMask message, length delimited. Does not implicitly {@link google.protobuf.FieldMask.verify|verify} messages.
             * @param message FieldMask message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IFieldMask, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a FieldMask message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns FieldMask
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.FieldMask;

            /**
             * Decodes a FieldMask message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns FieldMask
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.FieldMask;

            /**
             * Verifies a FieldMask message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a FieldMask message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns FieldMask
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.FieldMask;

            /**
             * Creates a plain object from a FieldMask message. Also converts values to other types if specified.
             * @param message FieldMask
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.FieldMask, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this FieldMask to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a Timestamp. */
        interface ITimestamp {

            /** Timestamp seconds */
            seconds?: (number|Long|string|null);

            /** Timestamp nanos */
            nanos?: (number|null);
        }

        /** Represents a Timestamp. */
        class Timestamp implements ITimestamp {

            /**
             * Constructs a new Timestamp.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.ITimestamp);

            /** Timestamp seconds. */
            public seconds: (number|Long|string);

            /** Timestamp nanos. */
            public nanos: number;

            /**
             * Creates a new Timestamp instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Timestamp instance
             */
            public static create(properties?: google.protobuf.ITimestamp): google.protobuf.Timestamp;

            /**
             * Encodes the specified Timestamp message. Does not implicitly {@link google.protobuf.Timestamp.verify|verify} messages.
             * @param message Timestamp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.ITimestamp, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Timestamp message, length delimited. Does not implicitly {@link google.protobuf.Timestamp.verify|verify} messages.
             * @param message Timestamp message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.ITimestamp, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Timestamp message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Timestamp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.Timestamp;

            /**
             * Decodes a Timestamp message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Timestamp
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.Timestamp;

            /**
             * Verifies a Timestamp message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Timestamp message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Timestamp
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.Timestamp;

            /**
             * Creates a plain object from a Timestamp message. Also converts values to other types if specified.
             * @param message Timestamp
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.Timestamp, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Timestamp to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a Struct. */
        interface IStruct {

            /** Struct fields */
            fields?: ({ [k: string]: google.protobuf.IValue }|null);
        }

        /** Represents a Struct. */
        class Struct implements IStruct {

            /**
             * Constructs a new Struct.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IStruct);

            /** Struct fields. */
            public fields: { [k: string]: google.protobuf.IValue };

            /**
             * Creates a new Struct instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Struct instance
             */
            public static create(properties?: google.protobuf.IStruct): google.protobuf.Struct;

            /**
             * Encodes the specified Struct message. Does not implicitly {@link google.protobuf.Struct.verify|verify} messages.
             * @param message Struct message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IStruct, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Struct message, length delimited. Does not implicitly {@link google.protobuf.Struct.verify|verify} messages.
             * @param message Struct message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IStruct, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Struct message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Struct
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.Struct;

            /**
             * Decodes a Struct message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Struct
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.Struct;

            /**
             * Verifies a Struct message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Struct message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Struct
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.Struct;

            /**
             * Creates a plain object from a Struct message. Also converts values to other types if specified.
             * @param message Struct
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.Struct, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Struct to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a Value. */
        interface IValue {

            /** Value nullValue */
            nullValue?: (google.protobuf.NullValue|keyof typeof google.protobuf.NullValue|null);

            /** Value numberValue */
            numberValue?: (number|null);

            /** Value stringValue */
            stringValue?: (string|null);

            /** Value boolValue */
            boolValue?: (boolean|null);

            /** Value structValue */
            structValue?: (google.protobuf.IStruct|null);

            /** Value listValue */
            listValue?: (google.protobuf.IListValue|null);
        }

        /** Represents a Value. */
        class Value implements IValue {

            /**
             * Constructs a new Value.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IValue);

            /** Value nullValue. */
            public nullValue?: (google.protobuf.NullValue|keyof typeof google.protobuf.NullValue|null);

            /** Value numberValue. */
            public numberValue?: (number|null);

            /** Value stringValue. */
            public stringValue?: (string|null);

            /** Value boolValue. */
            public boolValue?: (boolean|null);

            /** Value structValue. */
            public structValue?: (google.protobuf.IStruct|null);

            /** Value listValue. */
            public listValue?: (google.protobuf.IListValue|null);

            /** Value kind. */
            public kind?: ("nullValue"|"numberValue"|"stringValue"|"boolValue"|"structValue"|"listValue");

            /**
             * Creates a new Value instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Value instance
             */
            public static create(properties?: google.protobuf.IValue): google.protobuf.Value;

            /**
             * Encodes the specified Value message. Does not implicitly {@link google.protobuf.Value.verify|verify} messages.
             * @param message Value message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IValue, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Value message, length delimited. Does not implicitly {@link google.protobuf.Value.verify|verify} messages.
             * @param message Value message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IValue, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Value message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Value
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.Value;

            /**
             * Decodes a Value message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Value
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.Value;

            /**
             * Verifies a Value message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Value message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Value
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.Value;

            /**
             * Creates a plain object from a Value message. Also converts values to other types if specified.
             * @param message Value
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.Value, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Value to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** NullValue enum. */
        enum NullValue {
            NULL_VALUE = 0
        }

        /** Properties of a ListValue. */
        interface IListValue {

            /** ListValue values */
            values?: (google.protobuf.IValue[]|null);
        }

        /** Represents a ListValue. */
        class ListValue implements IListValue {

            /**
             * Constructs a new ListValue.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.protobuf.IListValue);

            /** ListValue values. */
            public values: google.protobuf.IValue[];

            /**
             * Creates a new ListValue instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ListValue instance
             */
            public static create(properties?: google.protobuf.IListValue): google.protobuf.ListValue;

            /**
             * Encodes the specified ListValue message. Does not implicitly {@link google.protobuf.ListValue.verify|verify} messages.
             * @param message ListValue message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.protobuf.IListValue, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ListValue message, length delimited. Does not implicitly {@link google.protobuf.ListValue.verify|verify} messages.
             * @param message ListValue message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.protobuf.IListValue, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ListValue message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ListValue
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.protobuf.ListValue;

            /**
             * Decodes a ListValue message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ListValue
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.protobuf.ListValue;

            /**
             * Verifies a ListValue message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ListValue message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ListValue
             */
            public static fromObject(object: { [k: string]: any }): google.protobuf.ListValue;

            /**
             * Creates a plain object from a ListValue message. Also converts values to other types if specified.
             * @param message ListValue
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.protobuf.ListValue, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ListValue to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }
    }

    /** Namespace rpc. */
    namespace rpc {

        /** Properties of a RetryInfo. */
        interface IRetryInfo {

            /** RetryInfo retryDelay */
            retryDelay?: (google.protobuf.IDuration|null);
        }

        /** Represents a RetryInfo. */
        class RetryInfo implements IRetryInfo {

            /**
             * Constructs a new RetryInfo.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.rpc.IRetryInfo);

            /** RetryInfo retryDelay. */
            public retryDelay?: (google.protobuf.IDuration|null);

            /**
             * Creates a new RetryInfo instance using the specified properties.
             * @param [properties] Properties to set
             * @returns RetryInfo instance
             */
            public static create(properties?: google.rpc.IRetryInfo): google.rpc.RetryInfo;

            /**
             * Encodes the specified RetryInfo message. Does not implicitly {@link google.rpc.RetryInfo.verify|verify} messages.
             * @param message RetryInfo message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.rpc.IRetryInfo, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified RetryInfo message, length delimited. Does not implicitly {@link google.rpc.RetryInfo.verify|verify} messages.
             * @param message RetryInfo message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.rpc.IRetryInfo, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a RetryInfo message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns RetryInfo
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.rpc.RetryInfo;

            /**
             * Decodes a RetryInfo message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns RetryInfo
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.rpc.RetryInfo;

            /**
             * Verifies a RetryInfo message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a RetryInfo message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns RetryInfo
             */
            public static fromObject(object: { [k: string]: any }): google.rpc.RetryInfo;

            /**
             * Creates a plain object from a RetryInfo message. Also converts values to other types if specified.
             * @param message RetryInfo
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.rpc.RetryInfo, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this RetryInfo to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a DebugInfo. */
        interface IDebugInfo {

            /** DebugInfo stackEntries */
            stackEntries?: (string[]|null);

            /** DebugInfo detail */
            detail?: (string|null);
        }

        /** Represents a DebugInfo. */
        class DebugInfo implements IDebugInfo {

            /**
             * Constructs a new DebugInfo.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.rpc.IDebugInfo);

            /** DebugInfo stackEntries. */
            public stackEntries: string[];

            /** DebugInfo detail. */
            public detail: string;

            /**
             * Creates a new DebugInfo instance using the specified properties.
             * @param [properties] Properties to set
             * @returns DebugInfo instance
             */
            public static create(properties?: google.rpc.IDebugInfo): google.rpc.DebugInfo;

            /**
             * Encodes the specified DebugInfo message. Does not implicitly {@link google.rpc.DebugInfo.verify|verify} messages.
             * @param message DebugInfo message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.rpc.IDebugInfo, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified DebugInfo message, length delimited. Does not implicitly {@link google.rpc.DebugInfo.verify|verify} messages.
             * @param message DebugInfo message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.rpc.IDebugInfo, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a DebugInfo message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns DebugInfo
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.rpc.DebugInfo;

            /**
             * Decodes a DebugInfo message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns DebugInfo
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.rpc.DebugInfo;

            /**
             * Verifies a DebugInfo message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a DebugInfo message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns DebugInfo
             */
            public static fromObject(object: { [k: string]: any }): google.rpc.DebugInfo;

            /**
             * Creates a plain object from a DebugInfo message. Also converts values to other types if specified.
             * @param message DebugInfo
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.rpc.DebugInfo, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this DebugInfo to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a QuotaFailure. */
        interface IQuotaFailure {

            /** QuotaFailure violations */
            violations?: (google.rpc.QuotaFailure.IViolation[]|null);
        }

        /** Represents a QuotaFailure. */
        class QuotaFailure implements IQuotaFailure {

            /**
             * Constructs a new QuotaFailure.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.rpc.IQuotaFailure);

            /** QuotaFailure violations. */
            public violations: google.rpc.QuotaFailure.IViolation[];

            /**
             * Creates a new QuotaFailure instance using the specified properties.
             * @param [properties] Properties to set
             * @returns QuotaFailure instance
             */
            public static create(properties?: google.rpc.IQuotaFailure): google.rpc.QuotaFailure;

            /**
             * Encodes the specified QuotaFailure message. Does not implicitly {@link google.rpc.QuotaFailure.verify|verify} messages.
             * @param message QuotaFailure message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.rpc.IQuotaFailure, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified QuotaFailure message, length delimited. Does not implicitly {@link google.rpc.QuotaFailure.verify|verify} messages.
             * @param message QuotaFailure message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.rpc.IQuotaFailure, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a QuotaFailure message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns QuotaFailure
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.rpc.QuotaFailure;

            /**
             * Decodes a QuotaFailure message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns QuotaFailure
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.rpc.QuotaFailure;

            /**
             * Verifies a QuotaFailure message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a QuotaFailure message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns QuotaFailure
             */
            public static fromObject(object: { [k: string]: any }): google.rpc.QuotaFailure;

            /**
             * Creates a plain object from a QuotaFailure message. Also converts values to other types if specified.
             * @param message QuotaFailure
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.rpc.QuotaFailure, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this QuotaFailure to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        namespace QuotaFailure {

            /** Properties of a Violation. */
            interface IViolation {

                /** Violation subject */
                subject?: (string|null);

                /** Violation description */
                description?: (string|null);
            }

            /** Represents a Violation. */
            class Violation implements IViolation {

                /**
                 * Constructs a new Violation.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.rpc.QuotaFailure.IViolation);

                /** Violation subject. */
                public subject: string;

                /** Violation description. */
                public description: string;

                /**
                 * Creates a new Violation instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns Violation instance
                 */
                public static create(properties?: google.rpc.QuotaFailure.IViolation): google.rpc.QuotaFailure.Violation;

                /**
                 * Encodes the specified Violation message. Does not implicitly {@link google.rpc.QuotaFailure.Violation.verify|verify} messages.
                 * @param message Violation message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.rpc.QuotaFailure.IViolation, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified Violation message, length delimited. Does not implicitly {@link google.rpc.QuotaFailure.Violation.verify|verify} messages.
                 * @param message Violation message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.rpc.QuotaFailure.IViolation, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a Violation message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns Violation
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.rpc.QuotaFailure.Violation;

                /**
                 * Decodes a Violation message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns Violation
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.rpc.QuotaFailure.Violation;

                /**
                 * Verifies a Violation message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a Violation message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns Violation
                 */
                public static fromObject(object: { [k: string]: any }): google.rpc.QuotaFailure.Violation;

                /**
                 * Creates a plain object from a Violation message. Also converts values to other types if specified.
                 * @param message Violation
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.rpc.QuotaFailure.Violation, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this Violation to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }
        }

        /** Properties of an ErrorInfo. */
        interface IErrorInfo {

            /** ErrorInfo reason */
            reason?: (string|null);

            /** ErrorInfo domain */
            domain?: (string|null);

            /** ErrorInfo metadata */
            metadata?: ({ [k: string]: string }|null);
        }

        /** Represents an ErrorInfo. */
        class ErrorInfo implements IErrorInfo {

            /**
             * Constructs a new ErrorInfo.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.rpc.IErrorInfo);

            /** ErrorInfo reason. */
            public reason: string;

            /** ErrorInfo domain. */
            public domain: string;

            /** ErrorInfo metadata. */
            public metadata: { [k: string]: string };

            /**
             * Creates a new ErrorInfo instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ErrorInfo instance
             */
            public static create(properties?: google.rpc.IErrorInfo): google.rpc.ErrorInfo;

            /**
             * Encodes the specified ErrorInfo message. Does not implicitly {@link google.rpc.ErrorInfo.verify|verify} messages.
             * @param message ErrorInfo message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.rpc.IErrorInfo, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ErrorInfo message, length delimited. Does not implicitly {@link google.rpc.ErrorInfo.verify|verify} messages.
             * @param message ErrorInfo message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.rpc.IErrorInfo, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an ErrorInfo message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ErrorInfo
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.rpc.ErrorInfo;

            /**
             * Decodes an ErrorInfo message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ErrorInfo
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.rpc.ErrorInfo;

            /**
             * Verifies an ErrorInfo message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an ErrorInfo message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ErrorInfo
             */
            public static fromObject(object: { [k: string]: any }): google.rpc.ErrorInfo;

            /**
             * Creates a plain object from an ErrorInfo message. Also converts values to other types if specified.
             * @param message ErrorInfo
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.rpc.ErrorInfo, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ErrorInfo to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a PreconditionFailure. */
        interface IPreconditionFailure {

            /** PreconditionFailure violations */
            violations?: (google.rpc.PreconditionFailure.IViolation[]|null);
        }

        /** Represents a PreconditionFailure. */
        class PreconditionFailure implements IPreconditionFailure {

            /**
             * Constructs a new PreconditionFailure.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.rpc.IPreconditionFailure);

            /** PreconditionFailure violations. */
            public violations: google.rpc.PreconditionFailure.IViolation[];

            /**
             * Creates a new PreconditionFailure instance using the specified properties.
             * @param [properties] Properties to set
             * @returns PreconditionFailure instance
             */
            public static create(properties?: google.rpc.IPreconditionFailure): google.rpc.PreconditionFailure;

            /**
             * Encodes the specified PreconditionFailure message. Does not implicitly {@link google.rpc.PreconditionFailure.verify|verify} messages.
             * @param message PreconditionFailure message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.rpc.IPreconditionFailure, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified PreconditionFailure message, length delimited. Does not implicitly {@link google.rpc.PreconditionFailure.verify|verify} messages.
             * @param message PreconditionFailure message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.rpc.IPreconditionFailure, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a PreconditionFailure message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns PreconditionFailure
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.rpc.PreconditionFailure;

            /**
             * Decodes a PreconditionFailure message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns PreconditionFailure
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.rpc.PreconditionFailure;

            /**
             * Verifies a PreconditionFailure message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a PreconditionFailure message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns PreconditionFailure
             */
            public static fromObject(object: { [k: string]: any }): google.rpc.PreconditionFailure;

            /**
             * Creates a plain object from a PreconditionFailure message. Also converts values to other types if specified.
             * @param message PreconditionFailure
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.rpc.PreconditionFailure, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this PreconditionFailure to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        namespace PreconditionFailure {

            /** Properties of a Violation. */
            interface IViolation {

                /** Violation type */
                type?: (string|null);

                /** Violation subject */
                subject?: (string|null);

                /** Violation description */
                description?: (string|null);
            }

            /** Represents a Violation. */
            class Violation implements IViolation {

                /**
                 * Constructs a new Violation.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.rpc.PreconditionFailure.IViolation);

                /** Violation type. */
                public type: string;

                /** Violation subject. */
                public subject: string;

                /** Violation description. */
                public description: string;

                /**
                 * Creates a new Violation instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns Violation instance
                 */
                public static create(properties?: google.rpc.PreconditionFailure.IViolation): google.rpc.PreconditionFailure.Violation;

                /**
                 * Encodes the specified Violation message. Does not implicitly {@link google.rpc.PreconditionFailure.Violation.verify|verify} messages.
                 * @param message Violation message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.rpc.PreconditionFailure.IViolation, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified Violation message, length delimited. Does not implicitly {@link google.rpc.PreconditionFailure.Violation.verify|verify} messages.
                 * @param message Violation message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.rpc.PreconditionFailure.IViolation, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a Violation message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns Violation
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.rpc.PreconditionFailure.Violation;

                /**
                 * Decodes a Violation message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns Violation
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.rpc.PreconditionFailure.Violation;

                /**
                 * Verifies a Violation message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a Violation message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns Violation
                 */
                public static fromObject(object: { [k: string]: any }): google.rpc.PreconditionFailure.Violation;

                /**
                 * Creates a plain object from a Violation message. Also converts values to other types if specified.
                 * @param message Violation
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.rpc.PreconditionFailure.Violation, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this Violation to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }
        }

        /** Properties of a BadRequest. */
        interface IBadRequest {

            /** BadRequest fieldViolations */
            fieldViolations?: (google.rpc.BadRequest.IFieldViolation[]|null);
        }

        /** Represents a BadRequest. */
        class BadRequest implements IBadRequest {

            /**
             * Constructs a new BadRequest.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.rpc.IBadRequest);

            /** BadRequest fieldViolations. */
            public fieldViolations: google.rpc.BadRequest.IFieldViolation[];

            /**
             * Creates a new BadRequest instance using the specified properties.
             * @param [properties] Properties to set
             * @returns BadRequest instance
             */
            public static create(properties?: google.rpc.IBadRequest): google.rpc.BadRequest;

            /**
             * Encodes the specified BadRequest message. Does not implicitly {@link google.rpc.BadRequest.verify|verify} messages.
             * @param message BadRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.rpc.IBadRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified BadRequest message, length delimited. Does not implicitly {@link google.rpc.BadRequest.verify|verify} messages.
             * @param message BadRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.rpc.IBadRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a BadRequest message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns BadRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.rpc.BadRequest;

            /**
             * Decodes a BadRequest message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns BadRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.rpc.BadRequest;

            /**
             * Verifies a BadRequest message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a BadRequest message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns BadRequest
             */
            public static fromObject(object: { [k: string]: any }): google.rpc.BadRequest;

            /**
             * Creates a plain object from a BadRequest message. Also converts values to other types if specified.
             * @param message BadRequest
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.rpc.BadRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this BadRequest to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        namespace BadRequest {

            /** Properties of a FieldViolation. */
            interface IFieldViolation {

                /** FieldViolation field */
                field?: (string|null);

                /** FieldViolation description */
                description?: (string|null);
            }

            /** Represents a FieldViolation. */
            class FieldViolation implements IFieldViolation {

                /**
                 * Constructs a new FieldViolation.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.rpc.BadRequest.IFieldViolation);

                /** FieldViolation field. */
                public field: string;

                /** FieldViolation description. */
                public description: string;

                /**
                 * Creates a new FieldViolation instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns FieldViolation instance
                 */
                public static create(properties?: google.rpc.BadRequest.IFieldViolation): google.rpc.BadRequest.FieldViolation;

                /**
                 * Encodes the specified FieldViolation message. Does not implicitly {@link google.rpc.BadRequest.FieldViolation.verify|verify} messages.
                 * @param message FieldViolation message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.rpc.BadRequest.IFieldViolation, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified FieldViolation message, length delimited. Does not implicitly {@link google.rpc.BadRequest.FieldViolation.verify|verify} messages.
                 * @param message FieldViolation message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.rpc.BadRequest.IFieldViolation, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a FieldViolation message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns FieldViolation
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.rpc.BadRequest.FieldViolation;

                /**
                 * Decodes a FieldViolation message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns FieldViolation
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.rpc.BadRequest.FieldViolation;

                /**
                 * Verifies a FieldViolation message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a FieldViolation message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns FieldViolation
                 */
                public static fromObject(object: { [k: string]: any }): google.rpc.BadRequest.FieldViolation;

                /**
                 * Creates a plain object from a FieldViolation message. Also converts values to other types if specified.
                 * @param message FieldViolation
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.rpc.BadRequest.FieldViolation, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this FieldViolation to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }
        }

        /** Properties of a RequestInfo. */
        interface IRequestInfo {

            /** RequestInfo requestId */
            requestId?: (string|null);

            /** RequestInfo servingData */
            servingData?: (string|null);
        }

        /** Represents a RequestInfo. */
        class RequestInfo implements IRequestInfo {

            /**
             * Constructs a new RequestInfo.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.rpc.IRequestInfo);

            /** RequestInfo requestId. */
            public requestId: string;

            /** RequestInfo servingData. */
            public servingData: string;

            /**
             * Creates a new RequestInfo instance using the specified properties.
             * @param [properties] Properties to set
             * @returns RequestInfo instance
             */
            public static create(properties?: google.rpc.IRequestInfo): google.rpc.RequestInfo;

            /**
             * Encodes the specified RequestInfo message. Does not implicitly {@link google.rpc.RequestInfo.verify|verify} messages.
             * @param message RequestInfo message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.rpc.IRequestInfo, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified RequestInfo message, length delimited. Does not implicitly {@link google.rpc.RequestInfo.verify|verify} messages.
             * @param message RequestInfo message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.rpc.IRequestInfo, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a RequestInfo message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns RequestInfo
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.rpc.RequestInfo;

            /**
             * Decodes a RequestInfo message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns RequestInfo
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.rpc.RequestInfo;

            /**
             * Verifies a RequestInfo message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a RequestInfo message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns RequestInfo
             */
            public static fromObject(object: { [k: string]: any }): google.rpc.RequestInfo;

            /**
             * Creates a plain object from a RequestInfo message. Also converts values to other types if specified.
             * @param message RequestInfo
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.rpc.RequestInfo, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this RequestInfo to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a ResourceInfo. */
        interface IResourceInfo {

            /** ResourceInfo resourceType */
            resourceType?: (string|null);

            /** ResourceInfo resourceName */
            resourceName?: (string|null);

            /** ResourceInfo owner */
            owner?: (string|null);

            /** ResourceInfo description */
            description?: (string|null);
        }

        /** Represents a ResourceInfo. */
        class ResourceInfo implements IResourceInfo {

            /**
             * Constructs a new ResourceInfo.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.rpc.IResourceInfo);

            /** ResourceInfo resourceType. */
            public resourceType: string;

            /** ResourceInfo resourceName. */
            public resourceName: string;

            /** ResourceInfo owner. */
            public owner: string;

            /** ResourceInfo description. */
            public description: string;

            /**
             * Creates a new ResourceInfo instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ResourceInfo instance
             */
            public static create(properties?: google.rpc.IResourceInfo): google.rpc.ResourceInfo;

            /**
             * Encodes the specified ResourceInfo message. Does not implicitly {@link google.rpc.ResourceInfo.verify|verify} messages.
             * @param message ResourceInfo message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.rpc.IResourceInfo, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ResourceInfo message, length delimited. Does not implicitly {@link google.rpc.ResourceInfo.verify|verify} messages.
             * @param message ResourceInfo message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.rpc.IResourceInfo, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ResourceInfo message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ResourceInfo
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.rpc.ResourceInfo;

            /**
             * Decodes a ResourceInfo message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ResourceInfo
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.rpc.ResourceInfo;

            /**
             * Verifies a ResourceInfo message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ResourceInfo message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ResourceInfo
             */
            public static fromObject(object: { [k: string]: any }): google.rpc.ResourceInfo;

            /**
             * Creates a plain object from a ResourceInfo message. Also converts values to other types if specified.
             * @param message ResourceInfo
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.rpc.ResourceInfo, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ResourceInfo to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a Help. */
        interface IHelp {

            /** Help links */
            links?: (google.rpc.Help.ILink[]|null);
        }

        /** Represents a Help. */
        class Help implements IHelp {

            /**
             * Constructs a new Help.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.rpc.IHelp);

            /** Help links. */
            public links: google.rpc.Help.ILink[];

            /**
             * Creates a new Help instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Help instance
             */
            public static create(properties?: google.rpc.IHelp): google.rpc.Help;

            /**
             * Encodes the specified Help message. Does not implicitly {@link google.rpc.Help.verify|verify} messages.
             * @param message Help message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.rpc.IHelp, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Help message, length delimited. Does not implicitly {@link google.rpc.Help.verify|verify} messages.
             * @param message Help message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.rpc.IHelp, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Help message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Help
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.rpc.Help;

            /**
             * Decodes a Help message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Help
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.rpc.Help;

            /**
             * Verifies a Help message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Help message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Help
             */
            public static fromObject(object: { [k: string]: any }): google.rpc.Help;

            /**
             * Creates a plain object from a Help message. Also converts values to other types if specified.
             * @param message Help
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.rpc.Help, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Help to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        namespace Help {

            /** Properties of a Link. */
            interface ILink {

                /** Link description */
                description?: (string|null);

                /** Link url */
                url?: (string|null);
            }

            /** Represents a Link. */
            class Link implements ILink {

                /**
                 * Constructs a new Link.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.rpc.Help.ILink);

                /** Link description. */
                public description: string;

                /** Link url. */
                public url: string;

                /**
                 * Creates a new Link instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns Link instance
                 */
                public static create(properties?: google.rpc.Help.ILink): google.rpc.Help.Link;

                /**
                 * Encodes the specified Link message. Does not implicitly {@link google.rpc.Help.Link.verify|verify} messages.
                 * @param message Link message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.rpc.Help.ILink, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified Link message, length delimited. Does not implicitly {@link google.rpc.Help.Link.verify|verify} messages.
                 * @param message Link message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.rpc.Help.ILink, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a Link message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns Link
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.rpc.Help.Link;

                /**
                 * Decodes a Link message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns Link
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.rpc.Help.Link;

                /**
                 * Verifies a Link message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a Link message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns Link
                 */
                public static fromObject(object: { [k: string]: any }): google.rpc.Help.Link;

                /**
                 * Creates a plain object from a Link message. Also converts values to other types if specified.
                 * @param message Link
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.rpc.Help.Link, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this Link to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }
        }

        /** Properties of a LocalizedMessage. */
        interface ILocalizedMessage {

            /** LocalizedMessage locale */
            locale?: (string|null);

            /** LocalizedMessage message */
            message?: (string|null);
        }

        /** Represents a LocalizedMessage. */
        class LocalizedMessage implements ILocalizedMessage {

            /**
             * Constructs a new LocalizedMessage.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.rpc.ILocalizedMessage);

            /** LocalizedMessage locale. */
            public locale: string;

            /** LocalizedMessage message. */
            public message: string;

            /**
             * Creates a new LocalizedMessage instance using the specified properties.
             * @param [properties] Properties to set
             * @returns LocalizedMessage instance
             */
            public static create(properties?: google.rpc.ILocalizedMessage): google.rpc.LocalizedMessage;

            /**
             * Encodes the specified LocalizedMessage message. Does not implicitly {@link google.rpc.LocalizedMessage.verify|verify} messages.
             * @param message LocalizedMessage message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.rpc.ILocalizedMessage, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified LocalizedMessage message, length delimited. Does not implicitly {@link google.rpc.LocalizedMessage.verify|verify} messages.
             * @param message LocalizedMessage message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.rpc.ILocalizedMessage, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a LocalizedMessage message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns LocalizedMessage
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.rpc.LocalizedMessage;

            /**
             * Decodes a LocalizedMessage message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns LocalizedMessage
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.rpc.LocalizedMessage;

            /**
             * Verifies a LocalizedMessage message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a LocalizedMessage message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns LocalizedMessage
             */
            public static fromObject(object: { [k: string]: any }): google.rpc.LocalizedMessage;

            /**
             * Creates a plain object from a LocalizedMessage message. Also converts values to other types if specified.
             * @param message LocalizedMessage
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.rpc.LocalizedMessage, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this LocalizedMessage to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a Status. */
        interface IStatus {

            /** Status code */
            code?: (number|null);

            /** Status message */
            message?: (string|null);

            /** Status details */
            details?: (google.protobuf.IAny[]|null);
        }

        /** Represents a Status. */
        class Status implements IStatus {

            /**
             * Constructs a new Status.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.rpc.IStatus);

            /** Status code. */
            public code: number;

            /** Status message. */
            public message: string;

            /** Status details. */
            public details: google.protobuf.IAny[];

            /**
             * Creates a new Status instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Status instance
             */
            public static create(properties?: google.rpc.IStatus): google.rpc.Status;

            /**
             * Encodes the specified Status message. Does not implicitly {@link google.rpc.Status.verify|verify} messages.
             * @param message Status message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.rpc.IStatus, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Status message, length delimited. Does not implicitly {@link google.rpc.Status.verify|verify} messages.
             * @param message Status message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.rpc.IStatus, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Status message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Status
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.rpc.Status;

            /**
             * Decodes a Status message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Status
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.rpc.Status;

            /**
             * Verifies a Status message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Status message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Status
             */
            public static fromObject(object: { [k: string]: any }): google.rpc.Status;

            /**
             * Creates a plain object from a Status message. Also converts values to other types if specified.
             * @param message Status
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.rpc.Status, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Status to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }
    }

    /** Namespace spanner. */
    namespace spanner {

        /** Namespace admin. */
        namespace admin {

            /** Namespace database. */
            namespace database {

                /** Namespace v1. */
                namespace v1 {

                    /** Properties of a Backup. */
                    interface IBackup {

                        /** Backup database */
                        database?: (string|null);

                        /** Backup versionTime */
                        versionTime?: (google.protobuf.ITimestamp|null);

                        /** Backup expireTime */
                        expireTime?: (google.protobuf.ITimestamp|null);

                        /** Backup name */
                        name?: (string|null);

                        /** Backup createTime */
                        createTime?: (google.protobuf.ITimestamp|null);

                        /** Backup sizeBytes */
                        sizeBytes?: (number|Long|string|null);

                        /** Backup state */
                        state?: (google.spanner.admin.database.v1.Backup.State|keyof typeof google.spanner.admin.database.v1.Backup.State|null);

                        /** Backup referencingDatabases */
                        referencingDatabases?: (string[]|null);

                        /** Backup encryptionInfo */
                        encryptionInfo?: (google.spanner.admin.database.v1.IEncryptionInfo|null);

                        /** Backup databaseDialect */
                        databaseDialect?: (google.spanner.admin.database.v1.DatabaseDialect|keyof typeof google.spanner.admin.database.v1.DatabaseDialect|null);

                        /** Backup referencingBackups */
                        referencingBackups?: (string[]|null);

                        /** Backup maxExpireTime */
                        maxExpireTime?: (google.protobuf.ITimestamp|null);
                    }

                    /** Represents a Backup. */
                    class Backup implements IBackup {

                        /**
                         * Constructs a new Backup.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: google.spanner.admin.database.v1.IBackup);

                        /** Backup database. */
                        public database: string;

                        /** Backup versionTime. */
                        public versionTime?: (google.protobuf.ITimestamp|null);

                        /** Backup expireTime. */
                        public expireTime?: (google.protobuf.ITimestamp|null);

                        /** Backup name. */
                        public name: string;

                        /** Backup createTime. */
                        public createTime?: (google.protobuf.ITimestamp|null);

                        /** Backup sizeBytes. */
                        public sizeBytes: (number|Long|string);

                        /** Backup state. */
                        public state: (google.spanner.admin.database.v1.Backup.State|keyof typeof google.spanner.admin.database.v1.Backup.State);

                        /** Backup referencingDatabases. */
                        public referencingDatabases: string[];

                        /** Backup encryptionInfo. */
                        public encryptionInfo?: (google.spanner.admin.database.v1.IEncryptionInfo|null);

                        /** Backup databaseDialect. */
                        public databaseDialect: (google.spanner.admin.database.v1.DatabaseDialect|keyof typeof google.spanner.admin.database.v1.DatabaseDialect);

                        /** Backup referencingBackups. */
                        public referencingBackups: string[];

                        /** Backup maxExpireTime. */
                        public maxExpireTime?: (google.protobuf.ITimestamp|null);

                        /**
                         * Creates a new Backup instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns Backup instance
                         */
                        public static create(properties?: google.spanner.admin.database.v1.IBackup): google.spanner.admin.database.v1.Backup;

                        /**
                         * Encodes the specified Backup message. Does not implicitly {@link google.spanner.admin.database.v1.Backup.verify|verify} messages.
                         * @param message Backup message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: google.spanner.admin.database.v1.IBackup, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified Backup message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.Backup.verify|verify} messages.
                         * @param message Backup message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: google.spanner.admin.database.v1.IBackup, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes a Backup message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns Backup
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.Backup;

                        /**
                         * Decodes a Backup message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns Backup
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.Backup;

                        /**
                         * Verifies a Backup message.
                         * @param message Plain object to verify
                         * @returns `null` if valid, otherwise the reason why it is not
                         */
                        public static verify(message: { [k: string]: any }): (string|null);

                        /**
                         * Creates a Backup message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns Backup
                         */
                        public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.Backup;

                        /**
                         * Creates a plain object from a Backup message. Also converts values to other types if specified.
                         * @param message Backup
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: google.spanner.admin.database.v1.Backup, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this Backup to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };
                    }

                    namespace Backup {

                        /** State enum. */
                        enum State {
                            STATE_UNSPECIFIED = 0,
                            CREATING = 1,
                            READY = 2
                        }
                    }

                    /** Properties of a CreateBackupRequest. */
                    interface ICreateBackupRequest {

                        /** CreateBackupRequest parent */
                        parent?: (string|null);

                        /** CreateBackupRequest backupId */
                        backupId?: (string|null);

                        /** CreateBackupRequest backup */
                        backup?: (google.spanner.admin.database.v1.IBackup|null);

                        /** CreateBackupRequest encryptionConfig */
                        encryptionConfig?: (google.spanner.admin.database.v1.ICreateBackupEncryptionConfig|null);
                    }

                    /** Represents a CreateBackupRequest. */
                    class CreateBackupRequest implements ICreateBackupRequest {

                        /**
                         * Constructs a new CreateBackupRequest.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: google.spanner.admin.database.v1.ICreateBackupRequest);

                        /** CreateBackupRequest parent. */
                        public parent: string;

                        /** CreateBackupRequest backupId. */
                        public backupId: string;

                        /** CreateBackupRequest backup. */
                        public backup?: (google.spanner.admin.database.v1.IBackup|null);

                        /** CreateBackupRequest encryptionConfig. */
                        public encryptionConfig?: (google.spanner.admin.database.v1.ICreateBackupEncryptionConfig|null);

                        /**
                         * Creates a new CreateBackupRequest instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns CreateBackupRequest instance
                         */
                        public static create(properties?: google.spanner.admin.database.v1.ICreateBackupRequest): google.spanner.admin.database.v1.CreateBackupRequest;

                        /**
                         * Encodes the specified CreateBackupRequest message. Does not implicitly {@link google.spanner.admin.database.v1.CreateBackupRequest.verify|verify} messages.
                         * @param message CreateBackupRequest message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: google.spanner.admin.database.v1.ICreateBackupRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified CreateBackupRequest message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.CreateBackupRequest.verify|verify} messages.
                         * @param message CreateBackupRequest message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: google.spanner.admin.database.v1.ICreateBackupRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes a CreateBackupRequest message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns CreateBackupRequest
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.CreateBackupRequest;

                        /**
                         * Decodes a CreateBackupRequest message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns CreateBackupRequest
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.CreateBackupRequest;

                        /**
                         * Verifies a CreateBackupRequest message.
                         * @param message Plain object to verify
                         * @returns `null` if valid, otherwise the reason why it is not
                         */
                        public static verify(message: { [k: string]: any }): (string|null);

                        /**
                         * Creates a CreateBackupRequest message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns CreateBackupRequest
                         */
                        public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.CreateBackupRequest;

                        /**
                         * Creates a plain object from a CreateBackupRequest message. Also converts values to other types if specified.
                         * @param message CreateBackupRequest
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: google.spanner.admin.database.v1.CreateBackupRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this CreateBackupRequest to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };
                    }

                    /** Properties of a CreateBackupMetadata. */
                    interface ICreateBackupMetadata {

                        /** CreateBackupMetadata name */
                        name?: (string|null);

                        /** CreateBackupMetadata database */
                        database?: (string|null);

                        /** CreateBackupMetadata progress */
                        progress?: (google.spanner.admin.database.v1.IOperationProgress|null);

                        /** CreateBackupMetadata cancelTime */
                        cancelTime?: (google.protobuf.ITimestamp|null);
                    }

                    /** Represents a CreateBackupMetadata. */
                    class CreateBackupMetadata implements ICreateBackupMetadata {

                        /**
                         * Constructs a new CreateBackupMetadata.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: google.spanner.admin.database.v1.ICreateBackupMetadata);

                        /** CreateBackupMetadata name. */
                        public name: string;

                        /** CreateBackupMetadata database. */
                        public database: string;

                        /** CreateBackupMetadata progress. */
                        public progress?: (google.spanner.admin.database.v1.IOperationProgress|null);

                        /** CreateBackupMetadata cancelTime. */
                        public cancelTime?: (google.protobuf.ITimestamp|null);

                        /**
                         * Creates a new CreateBackupMetadata instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns CreateBackupMetadata instance
                         */
                        public static create(properties?: google.spanner.admin.database.v1.ICreateBackupMetadata): google.spanner.admin.database.v1.CreateBackupMetadata;

                        /**
                         * Encodes the specified CreateBackupMetadata message. Does not implicitly {@link google.spanner.admin.database.v1.CreateBackupMetadata.verify|verify} messages.
                         * @param message CreateBackupMetadata message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: google.spanner.admin.database.v1.ICreateBackupMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified CreateBackupMetadata message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.CreateBackupMetadata.verify|verify} messages.
                         * @param message CreateBackupMetadata message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: google.spanner.admin.database.v1.ICreateBackupMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes a CreateBackupMetadata message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns CreateBackupMetadata
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.CreateBackupMetadata;

                        /**
                         * Decodes a CreateBackupMetadata message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns CreateBackupMetadata
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.CreateBackupMetadata;

                        /**
                         * Verifies a CreateBackupMetadata message.
                         * @param message Plain object to verify
                         * @returns `null` if valid, otherwise the reason why it is not
                         */
                        public static verify(message: { [k: string]: any }): (string|null);

                        /**
                         * Creates a CreateBackupMetadata message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns CreateBackupMetadata
                         */
                        public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.CreateBackupMetadata;

                        /**
                         * Creates a plain object from a CreateBackupMetadata message. Also converts values to other types if specified.
                         * @param message CreateBackupMetadata
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: google.spanner.admin.database.v1.CreateBackupMetadata, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this CreateBackupMetadata to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };
                    }

                    /** Properties of a CopyBackupRequest. */
                    interface ICopyBackupRequest {

                        /** CopyBackupRequest parent */
                        parent?: (string|null);

                        /** CopyBackupRequest backupId */
                        backupId?: (string|null);

                        /** CopyBackupRequest sourceBackup */
                        sourceBackup?: (string|null);

                        /** CopyBackupRequest expireTime */
                        expireTime?: (google.protobuf.ITimestamp|null);

                        /** CopyBackupRequest encryptionConfig */
                        encryptionConfig?: (google.spanner.admin.database.v1.ICopyBackupEncryptionConfig|null);
                    }

                    /** Represents a CopyBackupRequest. */
                    class CopyBackupRequest implements ICopyBackupRequest {

                        /**
                         * Constructs a new CopyBackupRequest.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: google.spanner.admin.database.v1.ICopyBackupRequest);

                        /** CopyBackupRequest parent. */
                        public parent: string;

                        /** CopyBackupRequest backupId. */
                        public backupId: string;

                        /** CopyBackupRequest sourceBackup. */
                        public sourceBackup: string;

                        /** CopyBackupRequest expireTime. */
                        public expireTime?: (google.protobuf.ITimestamp|null);

                        /** CopyBackupRequest encryptionConfig. */
                        public encryptionConfig?: (google.spanner.admin.database.v1.ICopyBackupEncryptionConfig|null);

                        /**
                         * Creates a new CopyBackupRequest instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns CopyBackupRequest instance
                         */
                        public static create(properties?: google.spanner.admin.database.v1.ICopyBackupRequest): google.spanner.admin.database.v1.CopyBackupRequest;

                        /**
                         * Encodes the specified CopyBackupRequest message. Does not implicitly {@link google.spanner.admin.database.v1.CopyBackupRequest.verify|verify} messages.
                         * @param message CopyBackupRequest message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: google.spanner.admin.database.v1.ICopyBackupRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified CopyBackupRequest message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.CopyBackupRequest.verify|verify} messages.
                         * @param message CopyBackupRequest message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: google.spanner.admin.database.v1.ICopyBackupRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes a CopyBackupRequest message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns CopyBackupRequest
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.CopyBackupRequest;

                        /**
                         * Decodes a CopyBackupRequest message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns CopyBackupRequest
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.CopyBackupRequest;

                        /**
                         * Verifies a CopyBackupRequest message.
                         * @param message Plain object to verify
                         * @returns `null` if valid, otherwise the reason why it is not
                         */
                        public static verify(message: { [k: string]: any }): (string|null);

                        /**
                         * Creates a CopyBackupRequest message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns CopyBackupRequest
                         */
                        public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.CopyBackupRequest;

                        /**
                         * Creates a plain object from a CopyBackupRequest message. Also converts values to other types if specified.
                         * @param message CopyBackupRequest
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: google.spanner.admin.database.v1.CopyBackupRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this CopyBackupRequest to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };
                    }

                    /** Properties of a CopyBackupMetadata. */
                    interface ICopyBackupMetadata {

                        /** CopyBackupMetadata name */
                        name?: (string|null);

                        /** CopyBackupMetadata sourceBackup */
                        sourceBackup?: (string|null);

                        /** CopyBackupMetadata progress */
                        progress?: (google.spanner.admin.database.v1.IOperationProgress|null);

                        /** CopyBackupMetadata cancelTime */
                        cancelTime?: (google.protobuf.ITimestamp|null);
                    }

                    /** Represents a CopyBackupMetadata. */
                    class CopyBackupMetadata implements ICopyBackupMetadata {

                        /**
                         * Constructs a new CopyBackupMetadata.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: google.spanner.admin.database.v1.ICopyBackupMetadata);

                        /** CopyBackupMetadata name. */
                        public name: string;

                        /** CopyBackupMetadata sourceBackup. */
                        public sourceBackup: string;

                        /** CopyBackupMetadata progress. */
                        public progress?: (google.spanner.admin.database.v1.IOperationProgress|null);

                        /** CopyBackupMetadata cancelTime. */
                        public cancelTime?: (google.protobuf.ITimestamp|null);

                        /**
                         * Creates a new CopyBackupMetadata instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns CopyBackupMetadata instance
                         */
                        public static create(properties?: google.spanner.admin.database.v1.ICopyBackupMetadata): google.spanner.admin.database.v1.CopyBackupMetadata;

                        /**
                         * Encodes the specified CopyBackupMetadata message. Does not implicitly {@link google.spanner.admin.database.v1.CopyBackupMetadata.verify|verify} messages.
                         * @param message CopyBackupMetadata message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: google.spanner.admin.database.v1.ICopyBackupMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified CopyBackupMetadata message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.CopyBackupMetadata.verify|verify} messages.
                         * @param message CopyBackupMetadata message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: google.spanner.admin.database.v1.ICopyBackupMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes a CopyBackupMetadata message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns CopyBackupMetadata
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.CopyBackupMetadata;

                        /**
                         * Decodes a CopyBackupMetadata message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns CopyBackupMetadata
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.CopyBackupMetadata;

                        /**
                         * Verifies a CopyBackupMetadata message.
                         * @param message Plain object to verify
                         * @returns `null` if valid, otherwise the reason why it is not
                         */
                        public static verify(message: { [k: string]: any }): (string|null);

                        /**
                         * Creates a CopyBackupMetadata message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns CopyBackupMetadata
                         */
                        public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.CopyBackupMetadata;

                        /**
                         * Creates a plain object from a CopyBackupMetadata message. Also converts values to other types if specified.
                         * @param message CopyBackupMetadata
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: google.spanner.admin.database.v1.CopyBackupMetadata, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this CopyBackupMetadata to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };
                    }

                    /** Properties of an UpdateBackupRequest. */
                    interface IUpdateBackupRequest {

                        /** UpdateBackupRequest backup */
                        backup?: (google.spanner.admin.database.v1.IBackup|null);

                        /** UpdateBackupRequest updateMask */
                        updateMask?: (google.protobuf.IFieldMask|null);
                    }

                    /** Represents an UpdateBackupRequest. */
                    class UpdateBackupRequest implements IUpdateBackupRequest {

                        /**
                         * Constructs a new UpdateBackupRequest.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: google.spanner.admin.database.v1.IUpdateBackupRequest);

                        /** UpdateBackupRequest backup. */
                        public backup?: (google.spanner.admin.database.v1.IBackup|null);

                        /** UpdateBackupRequest updateMask. */
                        public updateMask?: (google.protobuf.IFieldMask|null);

                        /**
                         * Creates a new UpdateBackupRequest instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns UpdateBackupRequest instance
                         */
                        public static create(properties?: google.spanner.admin.database.v1.IUpdateBackupRequest): google.spanner.admin.database.v1.UpdateBackupRequest;

                        /**
                         * Encodes the specified UpdateBackupRequest message. Does not implicitly {@link google.spanner.admin.database.v1.UpdateBackupRequest.verify|verify} messages.
                         * @param message UpdateBackupRequest message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: google.spanner.admin.database.v1.IUpdateBackupRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified UpdateBackupRequest message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.UpdateBackupRequest.verify|verify} messages.
                         * @param message UpdateBackupRequest message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: google.spanner.admin.database.v1.IUpdateBackupRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes an UpdateBackupRequest message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns UpdateBackupRequest
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.UpdateBackupRequest;

                        /**
                         * Decodes an UpdateBackupRequest message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns UpdateBackupRequest
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.UpdateBackupRequest;

                        /**
                         * Verifies an UpdateBackupRequest message.
                         * @param message Plain object to verify
                         * @returns `null` if valid, otherwise the reason why it is not
                         */
                        public static verify(message: { [k: string]: any }): (string|null);

                        /**
                         * Creates an UpdateBackupRequest message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns UpdateBackupRequest
                         */
                        public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.UpdateBackupRequest;

                        /**
                         * Creates a plain object from an UpdateBackupRequest message. Also converts values to other types if specified.
                         * @param message UpdateBackupRequest
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: google.spanner.admin.database.v1.UpdateBackupRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this UpdateBackupRequest to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };
                    }

                    /** Properties of a GetBackupRequest. */
                    interface IGetBackupRequest {

                        /** GetBackupRequest name */
                        name?: (string|null);
                    }

                    /** Represents a GetBackupRequest. */
                    class GetBackupRequest implements IGetBackupRequest {

                        /**
                         * Constructs a new GetBackupRequest.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: google.spanner.admin.database.v1.IGetBackupRequest);

                        /** GetBackupRequest name. */
                        public name: string;

                        /**
                         * Creates a new GetBackupRequest instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns GetBackupRequest instance
                         */
                        public static create(properties?: google.spanner.admin.database.v1.IGetBackupRequest): google.spanner.admin.database.v1.GetBackupRequest;

                        /**
                         * Encodes the specified GetBackupRequest message. Does not implicitly {@link google.spanner.admin.database.v1.GetBackupRequest.verify|verify} messages.
                         * @param message GetBackupRequest message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: google.spanner.admin.database.v1.IGetBackupRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified GetBackupRequest message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.GetBackupRequest.verify|verify} messages.
                         * @param message GetBackupRequest message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: google.spanner.admin.database.v1.IGetBackupRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes a GetBackupRequest message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns GetBackupRequest
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.GetBackupRequest;

                        /**
                         * Decodes a GetBackupRequest message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns GetBackupRequest
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.GetBackupRequest;

                        /**
                         * Verifies a GetBackupRequest message.
                         * @param message Plain object to verify
                         * @returns `null` if valid, otherwise the reason why it is not
                         */
                        public static verify(message: { [k: string]: any }): (string|null);

                        /**
                         * Creates a GetBackupRequest message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns GetBackupRequest
                         */
                        public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.GetBackupRequest;

                        /**
                         * Creates a plain object from a GetBackupRequest message. Also converts values to other types if specified.
                         * @param message GetBackupRequest
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: google.spanner.admin.database.v1.GetBackupRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this GetBackupRequest to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };
                    }

                    /** Properties of a DeleteBackupRequest. */
                    interface IDeleteBackupRequest {

                        /** DeleteBackupRequest name */
                        name?: (string|null);
                    }

                    /** Represents a DeleteBackupRequest. */
                    class DeleteBackupRequest implements IDeleteBackupRequest {

                        /**
                         * Constructs a new DeleteBackupRequest.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: google.spanner.admin.database.v1.IDeleteBackupRequest);

                        /** DeleteBackupRequest name. */
                        public name: string;

                        /**
                         * Creates a new DeleteBackupRequest instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns DeleteBackupRequest instance
                         */
                        public static create(properties?: google.spanner.admin.database.v1.IDeleteBackupRequest): google.spanner.admin.database.v1.DeleteBackupRequest;

                        /**
                         * Encodes the specified DeleteBackupRequest message. Does not implicitly {@link google.spanner.admin.database.v1.DeleteBackupRequest.verify|verify} messages.
                         * @param message DeleteBackupRequest message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: google.spanner.admin.database.v1.IDeleteBackupRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified DeleteBackupRequest message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.DeleteBackupRequest.verify|verify} messages.
                         * @param message DeleteBackupRequest message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: google.spanner.admin.database.v1.IDeleteBackupRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes a DeleteBackupRequest message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns DeleteBackupRequest
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.DeleteBackupRequest;

                        /**
                         * Decodes a DeleteBackupRequest message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns DeleteBackupRequest
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.DeleteBackupRequest;

                        /**
                         * Verifies a DeleteBackupRequest message.
                         * @param message Plain object to verify
                         * @returns `null` if valid, otherwise the reason why it is not
                         */
                        public static verify(message: { [k: string]: any }): (string|null);

                        /**
                         * Creates a DeleteBackupRequest message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns DeleteBackupRequest
                         */
                        public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.DeleteBackupRequest;

                        /**
                         * Creates a plain object from a DeleteBackupRequest message. Also converts values to other types if specified.
                         * @param message DeleteBackupRequest
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: google.spanner.admin.database.v1.DeleteBackupRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this DeleteBackupRequest to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };
                    }

                    /** Properties of a ListBackupsRequest. */
                    interface IListBackupsRequest {

                        /** ListBackupsRequest parent */
                        parent?: (string|null);

                        /** ListBackupsRequest filter */
                        filter?: (string|null);

                        /** ListBackupsRequest pageSize */
                        pageSize?: (number|null);

                        /** ListBackupsRequest pageToken */
                        pageToken?: (string|null);
                    }

                    /** Represents a ListBackupsRequest. */
                    class ListBackupsRequest implements IListBackupsRequest {

                        /**
                         * Constructs a new ListBackupsRequest.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: google.spanner.admin.database.v1.IListBackupsRequest);

                        /** ListBackupsRequest parent. */
                        public parent: string;

                        /** ListBackupsRequest filter. */
                        public filter: string;

                        /** ListBackupsRequest pageSize. */
                        public pageSize: number;

                        /** ListBackupsRequest pageToken. */
                        public pageToken: string;

                        /**
                         * Creates a new ListBackupsRequest instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns ListBackupsRequest instance
                         */
                        public static create(properties?: google.spanner.admin.database.v1.IListBackupsRequest): google.spanner.admin.database.v1.ListBackupsRequest;

                        /**
                         * Encodes the specified ListBackupsRequest message. Does not implicitly {@link google.spanner.admin.database.v1.ListBackupsRequest.verify|verify} messages.
                         * @param message ListBackupsRequest message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: google.spanner.admin.database.v1.IListBackupsRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified ListBackupsRequest message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.ListBackupsRequest.verify|verify} messages.
                         * @param message ListBackupsRequest message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: google.spanner.admin.database.v1.IListBackupsRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes a ListBackupsRequest message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns ListBackupsRequest
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.ListBackupsRequest;

                        /**
                         * Decodes a ListBackupsRequest message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns ListBackupsRequest
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.ListBackupsRequest;

                        /**
                         * Verifies a ListBackupsRequest message.
                         * @param message Plain object to verify
                         * @returns `null` if valid, otherwise the reason why it is not
                         */
                        public static verify(message: { [k: string]: any }): (string|null);

                        /**
                         * Creates a ListBackupsRequest message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns ListBackupsRequest
                         */
                        public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.ListBackupsRequest;

                        /**
                         * Creates a plain object from a ListBackupsRequest message. Also converts values to other types if specified.
                         * @param message ListBackupsRequest
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: google.spanner.admin.database.v1.ListBackupsRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this ListBackupsRequest to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };
                    }

                    /** Properties of a ListBackupsResponse. */
                    interface IListBackupsResponse {

                        /** ListBackupsResponse backups */
                        backups?: (google.spanner.admin.database.v1.IBackup[]|null);

                        /** ListBackupsResponse nextPageToken */
                        nextPageToken?: (string|null);
                    }

                    /** Represents a ListBackupsResponse. */
                    class ListBackupsResponse implements IListBackupsResponse {

                        /**
                         * Constructs a new ListBackupsResponse.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: google.spanner.admin.database.v1.IListBackupsResponse);

                        /** ListBackupsResponse backups. */
                        public backups: google.spanner.admin.database.v1.IBackup[];

                        /** ListBackupsResponse nextPageToken. */
                        public nextPageToken: string;

                        /**
                         * Creates a new ListBackupsResponse instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns ListBackupsResponse instance
                         */
                        public static create(properties?: google.spanner.admin.database.v1.IListBackupsResponse): google.spanner.admin.database.v1.ListBackupsResponse;

                        /**
                         * Encodes the specified ListBackupsResponse message. Does not implicitly {@link google.spanner.admin.database.v1.ListBackupsResponse.verify|verify} messages.
                         * @param message ListBackupsResponse message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: google.spanner.admin.database.v1.IListBackupsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified ListBackupsResponse message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.ListBackupsResponse.verify|verify} messages.
                         * @param message ListBackupsResponse message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: google.spanner.admin.database.v1.IListBackupsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes a ListBackupsResponse message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns ListBackupsResponse
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.ListBackupsResponse;

                        /**
                         * Decodes a ListBackupsResponse message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns ListBackupsResponse
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.ListBackupsResponse;

                        /**
                         * Verifies a ListBackupsResponse message.
                         * @param message Plain object to verify
                         * @returns `null` if valid, otherwise the reason why it is not
                         */
                        public static verify(message: { [k: string]: any }): (string|null);

                        /**
                         * Creates a ListBackupsResponse message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns ListBackupsResponse
                         */
                        public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.ListBackupsResponse;

                        /**
                         * Creates a plain object from a ListBackupsResponse message. Also converts values to other types if specified.
                         * @param message ListBackupsResponse
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: google.spanner.admin.database.v1.ListBackupsResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this ListBackupsResponse to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };
                    }

                    /** Properties of a ListBackupOperationsRequest. */
                    interface IListBackupOperationsRequest {

                        /** ListBackupOperationsRequest parent */
                        parent?: (string|null);

                        /** ListBackupOperationsRequest filter */
                        filter?: (string|null);

                        /** ListBackupOperationsRequest pageSize */
                        pageSize?: (number|null);

                        /** ListBackupOperationsRequest pageToken */
                        pageToken?: (string|null);
                    }

                    /** Represents a ListBackupOperationsRequest. */
                    class ListBackupOperationsRequest implements IListBackupOperationsRequest {

                        /**
                         * Constructs a new ListBackupOperationsRequest.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: google.spanner.admin.database.v1.IListBackupOperationsRequest);

                        /** ListBackupOperationsRequest parent. */
                        public parent: string;

                        /** ListBackupOperationsRequest filter. */
                        public filter: string;

                        /** ListBackupOperationsRequest pageSize. */
                        public pageSize: number;

                        /** ListBackupOperationsRequest pageToken. */
                        public pageToken: string;

                        /**
                         * Creates a new ListBackupOperationsRequest instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns ListBackupOperationsRequest instance
                         */
                        public static create(properties?: google.spanner.admin.database.v1.IListBackupOperationsRequest): google.spanner.admin.database.v1.ListBackupOperationsRequest;

                        /**
                         * Encodes the specified ListBackupOperationsRequest message. Does not implicitly {@link google.spanner.admin.database.v1.ListBackupOperationsRequest.verify|verify} messages.
                         * @param message ListBackupOperationsRequest message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: google.spanner.admin.database.v1.IListBackupOperationsRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified ListBackupOperationsRequest message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.ListBackupOperationsRequest.verify|verify} messages.
                         * @param message ListBackupOperationsRequest message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: google.spanner.admin.database.v1.IListBackupOperationsRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes a ListBackupOperationsRequest message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns ListBackupOperationsRequest
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.ListBackupOperationsRequest;

                        /**
                         * Decodes a ListBackupOperationsRequest message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns ListBackupOperationsRequest
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.ListBackupOperationsRequest;

                        /**
                         * Verifies a ListBackupOperationsRequest message.
                         * @param message Plain object to verify
                         * @returns `null` if valid, otherwise the reason why it is not
                         */
                        public static verify(message: { [k: string]: any }): (string|null);

                        /**
                         * Creates a ListBackupOperationsRequest message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns ListBackupOperationsRequest
                         */
                        public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.ListBackupOperationsRequest;

                        /**
                         * Creates a plain object from a ListBackupOperationsRequest message. Also converts values to other types if specified.
                         * @param message ListBackupOperationsRequest
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: google.spanner.admin.database.v1.ListBackupOperationsRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this ListBackupOperationsRequest to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };
                    }

                    /** Properties of a ListBackupOperationsResponse. */
                    interface IListBackupOperationsResponse {

                        /** ListBackupOperationsResponse operations */
                        operations?: (google.longrunning.IOperation[]|null);

                        /** ListBackupOperationsResponse nextPageToken */
                        nextPageToken?: (string|null);
                    }

                    /** Represents a ListBackupOperationsResponse. */
                    class ListBackupOperationsResponse implements IListBackupOperationsResponse {

                        /**
                         * Constructs a new ListBackupOperationsResponse.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: google.spanner.admin.database.v1.IListBackupOperationsResponse);

                        /** ListBackupOperationsResponse operations. */
                        public operations: google.longrunning.IOperation[];

                        /** ListBackupOperationsResponse nextPageToken. */
                        public nextPageToken: string;

                        /**
                         * Creates a new ListBackupOperationsResponse instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns ListBackupOperationsResponse instance
                         */
                        public static create(properties?: google.spanner.admin.database.v1.IListBackupOperationsResponse): google.spanner.admin.database.v1.ListBackupOperationsResponse;

                        /**
                         * Encodes the specified ListBackupOperationsResponse message. Does not implicitly {@link google.spanner.admin.database.v1.ListBackupOperationsResponse.verify|verify} messages.
                         * @param message ListBackupOperationsResponse message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: google.spanner.admin.database.v1.IListBackupOperationsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified ListBackupOperationsResponse message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.ListBackupOperationsResponse.verify|verify} messages.
                         * @param message ListBackupOperationsResponse message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: google.spanner.admin.database.v1.IListBackupOperationsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes a ListBackupOperationsResponse message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns ListBackupOperationsResponse
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.ListBackupOperationsResponse;

                        /**
                         * Decodes a ListBackupOperationsResponse message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns ListBackupOperationsResponse
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.ListBackupOperationsResponse;

                        /**
                         * Verifies a ListBackupOperationsResponse message.
                         * @param message Plain object to verify
                         * @returns `null` if valid, otherwise the reason why it is not
                         */
                        public static verify(message: { [k: string]: any }): (string|null);

                        /**
                         * Creates a ListBackupOperationsResponse message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns ListBackupOperationsResponse
                         */
                        public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.ListBackupOperationsResponse;

                        /**
                         * Creates a plain object from a ListBackupOperationsResponse message. Also converts values to other types if specified.
                         * @param message ListBackupOperationsResponse
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: google.spanner.admin.database.v1.ListBackupOperationsResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this ListBackupOperationsResponse to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };
                    }

                    /** Properties of a BackupInfo. */
                    interface IBackupInfo {

                        /** BackupInfo backup */
                        backup?: (string|null);

                        /** BackupInfo versionTime */
                        versionTime?: (google.protobuf.ITimestamp|null);

                        /** BackupInfo createTime */
                        createTime?: (google.protobuf.ITimestamp|null);

                        /** BackupInfo sourceDatabase */
                        sourceDatabase?: (string|null);
                    }

                    /** Represents a BackupInfo. */
                    class BackupInfo implements IBackupInfo {

                        /**
                         * Constructs a new BackupInfo.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: google.spanner.admin.database.v1.IBackupInfo);

                        /** BackupInfo backup. */
                        public backup: string;

                        /** BackupInfo versionTime. */
                        public versionTime?: (google.protobuf.ITimestamp|null);

                        /** BackupInfo createTime. */
                        public createTime?: (google.protobuf.ITimestamp|null);

                        /** BackupInfo sourceDatabase. */
                        public sourceDatabase: string;

                        /**
                         * Creates a new BackupInfo instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns BackupInfo instance
                         */
                        public static create(properties?: google.spanner.admin.database.v1.IBackupInfo): google.spanner.admin.database.v1.BackupInfo;

                        /**
                         * Encodes the specified BackupInfo message. Does not implicitly {@link google.spanner.admin.database.v1.BackupInfo.verify|verify} messages.
                         * @param message BackupInfo message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: google.spanner.admin.database.v1.IBackupInfo, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified BackupInfo message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.BackupInfo.verify|verify} messages.
                         * @param message BackupInfo message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: google.spanner.admin.database.v1.IBackupInfo, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes a BackupInfo message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns BackupInfo
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.BackupInfo;

                        /**
                         * Decodes a BackupInfo message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns BackupInfo
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.BackupInfo;

                        /**
                         * Verifies a BackupInfo message.
                         * @param message Plain object to verify
                         * @returns `null` if valid, otherwise the reason why it is not
                         */
                        public static verify(message: { [k: string]: any }): (string|null);

                        /**
                         * Creates a BackupInfo message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns BackupInfo
                         */
                        public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.BackupInfo;

                        /**
                         * Creates a plain object from a BackupInfo message. Also converts values to other types if specified.
                         * @param message BackupInfo
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: google.spanner.admin.database.v1.BackupInfo, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this BackupInfo to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };
                    }

                    /** Properties of a CreateBackupEncryptionConfig. */
                    interface ICreateBackupEncryptionConfig {

                        /** CreateBackupEncryptionConfig encryptionType */
                        encryptionType?: (google.spanner.admin.database.v1.CreateBackupEncryptionConfig.EncryptionType|keyof typeof google.spanner.admin.database.v1.CreateBackupEncryptionConfig.EncryptionType|null);

                        /** CreateBackupEncryptionConfig kmsKeyName */
                        kmsKeyName?: (string|null);
                    }

                    /** Represents a CreateBackupEncryptionConfig. */
                    class CreateBackupEncryptionConfig implements ICreateBackupEncryptionConfig {

                        /**
                         * Constructs a new CreateBackupEncryptionConfig.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: google.spanner.admin.database.v1.ICreateBackupEncryptionConfig);

                        /** CreateBackupEncryptionConfig encryptionType. */
                        public encryptionType: (google.spanner.admin.database.v1.CreateBackupEncryptionConfig.EncryptionType|keyof typeof google.spanner.admin.database.v1.CreateBackupEncryptionConfig.EncryptionType);

                        /** CreateBackupEncryptionConfig kmsKeyName. */
                        public kmsKeyName: string;

                        /**
                         * Creates a new CreateBackupEncryptionConfig instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns CreateBackupEncryptionConfig instance
                         */
                        public static create(properties?: google.spanner.admin.database.v1.ICreateBackupEncryptionConfig): google.spanner.admin.database.v1.CreateBackupEncryptionConfig;

                        /**
                         * Encodes the specified CreateBackupEncryptionConfig message. Does not implicitly {@link google.spanner.admin.database.v1.CreateBackupEncryptionConfig.verify|verify} messages.
                         * @param message CreateBackupEncryptionConfig message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: google.spanner.admin.database.v1.ICreateBackupEncryptionConfig, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified CreateBackupEncryptionConfig message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.CreateBackupEncryptionConfig.verify|verify} messages.
                         * @param message CreateBackupEncryptionConfig message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: google.spanner.admin.database.v1.ICreateBackupEncryptionConfig, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes a CreateBackupEncryptionConfig message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns CreateBackupEncryptionConfig
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.CreateBackupEncryptionConfig;

                        /**
                         * Decodes a CreateBackupEncryptionConfig message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns CreateBackupEncryptionConfig
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.CreateBackupEncryptionConfig;

                        /**
                         * Verifies a CreateBackupEncryptionConfig message.
                         * @param message Plain object to verify
                         * @returns `null` if valid, otherwise the reason why it is not
                         */
                        public static verify(message: { [k: string]: any }): (string|null);

                        /**
                         * Creates a CreateBackupEncryptionConfig message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns CreateBackupEncryptionConfig
                         */
                        public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.CreateBackupEncryptionConfig;

                        /**
                         * Creates a plain object from a CreateBackupEncryptionConfig message. Also converts values to other types if specified.
                         * @param message CreateBackupEncryptionConfig
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: google.spanner.admin.database.v1.CreateBackupEncryptionConfig, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this CreateBackupEncryptionConfig to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };
                    }

                    namespace CreateBackupEncryptionConfig {

                        /** EncryptionType enum. */
                        enum EncryptionType {
                            ENCRYPTION_TYPE_UNSPECIFIED = 0,
                            USE_DATABASE_ENCRYPTION = 1,
                            GOOGLE_DEFAULT_ENCRYPTION = 2,
                            CUSTOMER_MANAGED_ENCRYPTION = 3
                        }
                    }

                    /** Properties of a CopyBackupEncryptionConfig. */
                    interface ICopyBackupEncryptionConfig {

                        /** CopyBackupEncryptionConfig encryptionType */
                        encryptionType?: (google.spanner.admin.database.v1.CopyBackupEncryptionConfig.EncryptionType|keyof typeof google.spanner.admin.database.v1.CopyBackupEncryptionConfig.EncryptionType|null);

                        /** CopyBackupEncryptionConfig kmsKeyName */
                        kmsKeyName?: (string|null);
                    }

                    /** Represents a CopyBackupEncryptionConfig. */
                    class CopyBackupEncryptionConfig implements ICopyBackupEncryptionConfig {

                        /**
                         * Constructs a new CopyBackupEncryptionConfig.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: google.spanner.admin.database.v1.ICopyBackupEncryptionConfig);

                        /** CopyBackupEncryptionConfig encryptionType. */
                        public encryptionType: (google.spanner.admin.database.v1.CopyBackupEncryptionConfig.EncryptionType|keyof typeof google.spanner.admin.database.v1.CopyBackupEncryptionConfig.EncryptionType);

                        /** CopyBackupEncryptionConfig kmsKeyName. */
                        public kmsKeyName: string;

                        /**
                         * Creates a new CopyBackupEncryptionConfig instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns CopyBackupEncryptionConfig instance
                         */
                        public static create(properties?: google.spanner.admin.database.v1.ICopyBackupEncryptionConfig): google.spanner.admin.database.v1.CopyBackupEncryptionConfig;

                        /**
                         * Encodes the specified CopyBackupEncryptionConfig message. Does not implicitly {@link google.spanner.admin.database.v1.CopyBackupEncryptionConfig.verify|verify} messages.
                         * @param message CopyBackupEncryptionConfig message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: google.spanner.admin.database.v1.ICopyBackupEncryptionConfig, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified CopyBackupEncryptionConfig message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.CopyBackupEncryptionConfig.verify|verify} messages.
                         * @param message CopyBackupEncryptionConfig message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: google.spanner.admin.database.v1.ICopyBackupEncryptionConfig, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes a CopyBackupEncryptionConfig message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns CopyBackupEncryptionConfig
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.CopyBackupEncryptionConfig;

                        /**
                         * Decodes a CopyBackupEncryptionConfig message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns CopyBackupEncryptionConfig
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.CopyBackupEncryptionConfig;

                        /**
                         * Verifies a CopyBackupEncryptionConfig message.
                         * @param message Plain object to verify
                         * @returns `null` if valid, otherwise the reason why it is not
                         */
                        public static verify(message: { [k: string]: any }): (string|null);

                        /**
                         * Creates a CopyBackupEncryptionConfig message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns CopyBackupEncryptionConfig
                         */
                        public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.CopyBackupEncryptionConfig;

                        /**
                         * Creates a plain object from a CopyBackupEncryptionConfig message. Also converts values to other types if specified.
                         * @param message CopyBackupEncryptionConfig
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: google.spanner.admin.database.v1.CopyBackupEncryptionConfig, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this CopyBackupEncryptionConfig to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };
                    }

                    namespace CopyBackupEncryptionConfig {

                        /** EncryptionType enum. */
                        enum EncryptionType {
                            ENCRYPTION_TYPE_UNSPECIFIED = 0,
                            USE_CONFIG_DEFAULT_OR_BACKUP_ENCRYPTION = 1,
                            GOOGLE_DEFAULT_ENCRYPTION = 2,
                            CUSTOMER_MANAGED_ENCRYPTION = 3
                        }
                    }

                    /** Properties of an OperationProgress. */
                    interface IOperationProgress {

                        /** OperationProgress progressPercent */
                        progressPercent?: (number|null);

                        /** OperationProgress startTime */
                        startTime?: (google.protobuf.ITimestamp|null);

                        /** OperationProgress endTime */
                        endTime?: (google.protobuf.ITimestamp|null);
                    }

                    /** Represents an OperationProgress. */
                    class OperationProgress implements IOperationProgress {

                        /**
                         * Constructs a new OperationProgress.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: google.spanner.admin.database.v1.IOperationProgress);

                        /** OperationProgress progressPercent. */
                        public progressPercent: number;

                        /** OperationProgress startTime. */
                        public startTime?: (google.protobuf.ITimestamp|null);

                        /** OperationProgress endTime. */
                        public endTime?: (google.protobuf.ITimestamp|null);

                        /**
                         * Creates a new OperationProgress instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns OperationProgress instance
                         */
                        public static create(properties?: google.spanner.admin.database.v1.IOperationProgress): google.spanner.admin.database.v1.OperationProgress;

                        /**
                         * Encodes the specified OperationProgress message. Does not implicitly {@link google.spanner.admin.database.v1.OperationProgress.verify|verify} messages.
                         * @param message OperationProgress message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: google.spanner.admin.database.v1.IOperationProgress, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified OperationProgress message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.OperationProgress.verify|verify} messages.
                         * @param message OperationProgress message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: google.spanner.admin.database.v1.IOperationProgress, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes an OperationProgress message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns OperationProgress
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.OperationProgress;

                        /**
                         * Decodes an OperationProgress message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns OperationProgress
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.OperationProgress;

                        /**
                         * Verifies an OperationProgress message.
                         * @param message Plain object to verify
                         * @returns `null` if valid, otherwise the reason why it is not
                         */
                        public static verify(message: { [k: string]: any }): (string|null);

                        /**
                         * Creates an OperationProgress message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns OperationProgress
                         */
                        public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.OperationProgress;

                        /**
                         * Creates a plain object from an OperationProgress message. Also converts values to other types if specified.
                         * @param message OperationProgress
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: google.spanner.admin.database.v1.OperationProgress, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this OperationProgress to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };
                    }

                    /** Properties of an EncryptionConfig. */
                    interface IEncryptionConfig {

                        /** EncryptionConfig kmsKeyName */
                        kmsKeyName?: (string|null);
                    }

                    /** Represents an EncryptionConfig. */
                    class EncryptionConfig implements IEncryptionConfig {

                        /**
                         * Constructs a new EncryptionConfig.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: google.spanner.admin.database.v1.IEncryptionConfig);

                        /** EncryptionConfig kmsKeyName. */
                        public kmsKeyName: string;

                        /**
                         * Creates a new EncryptionConfig instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns EncryptionConfig instance
                         */
                        public static create(properties?: google.spanner.admin.database.v1.IEncryptionConfig): google.spanner.admin.database.v1.EncryptionConfig;

                        /**
                         * Encodes the specified EncryptionConfig message. Does not implicitly {@link google.spanner.admin.database.v1.EncryptionConfig.verify|verify} messages.
                         * @param message EncryptionConfig message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: google.spanner.admin.database.v1.IEncryptionConfig, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified EncryptionConfig message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.EncryptionConfig.verify|verify} messages.
                         * @param message EncryptionConfig message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: google.spanner.admin.database.v1.IEncryptionConfig, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes an EncryptionConfig message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns EncryptionConfig
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.EncryptionConfig;

                        /**
                         * Decodes an EncryptionConfig message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns EncryptionConfig
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.EncryptionConfig;

                        /**
                         * Verifies an EncryptionConfig message.
                         * @param message Plain object to verify
                         * @returns `null` if valid, otherwise the reason why it is not
                         */
                        public static verify(message: { [k: string]: any }): (string|null);

                        /**
                         * Creates an EncryptionConfig message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns EncryptionConfig
                         */
                        public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.EncryptionConfig;

                        /**
                         * Creates a plain object from an EncryptionConfig message. Also converts values to other types if specified.
                         * @param message EncryptionConfig
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: google.spanner.admin.database.v1.EncryptionConfig, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this EncryptionConfig to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };
                    }

                    /** Properties of an EncryptionInfo. */
                    interface IEncryptionInfo {

                        /** EncryptionInfo encryptionType */
                        encryptionType?: (google.spanner.admin.database.v1.EncryptionInfo.Type|keyof typeof google.spanner.admin.database.v1.EncryptionInfo.Type|null);

                        /** EncryptionInfo encryptionStatus */
                        encryptionStatus?: (google.rpc.IStatus|null);

                        /** EncryptionInfo kmsKeyVersion */
                        kmsKeyVersion?: (string|null);
                    }

                    /** Represents an EncryptionInfo. */
                    class EncryptionInfo implements IEncryptionInfo {

                        /**
                         * Constructs a new EncryptionInfo.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: google.spanner.admin.database.v1.IEncryptionInfo);

                        /** EncryptionInfo encryptionType. */
                        public encryptionType: (google.spanner.admin.database.v1.EncryptionInfo.Type|keyof typeof google.spanner.admin.database.v1.EncryptionInfo.Type);

                        /** EncryptionInfo encryptionStatus. */
                        public encryptionStatus?: (google.rpc.IStatus|null);

                        /** EncryptionInfo kmsKeyVersion. */
                        public kmsKeyVersion: string;

                        /**
                         * Creates a new EncryptionInfo instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns EncryptionInfo instance
                         */
                        public static create(properties?: google.spanner.admin.database.v1.IEncryptionInfo): google.spanner.admin.database.v1.EncryptionInfo;

                        /**
                         * Encodes the specified EncryptionInfo message. Does not implicitly {@link google.spanner.admin.database.v1.EncryptionInfo.verify|verify} messages.
                         * @param message EncryptionInfo message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: google.spanner.admin.database.v1.IEncryptionInfo, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified EncryptionInfo message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.EncryptionInfo.verify|verify} messages.
                         * @param message EncryptionInfo message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: google.spanner.admin.database.v1.IEncryptionInfo, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes an EncryptionInfo message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns EncryptionInfo
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.EncryptionInfo;

                        /**
                         * Decodes an EncryptionInfo message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns EncryptionInfo
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.EncryptionInfo;

                        /**
                         * Verifies an EncryptionInfo message.
                         * @param message Plain object to verify
                         * @returns `null` if valid, otherwise the reason why it is not
                         */
                        public static verify(message: { [k: string]: any }): (string|null);

                        /**
                         * Creates an EncryptionInfo message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns EncryptionInfo
                         */
                        public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.EncryptionInfo;

                        /**
                         * Creates a plain object from an EncryptionInfo message. Also converts values to other types if specified.
                         * @param message EncryptionInfo
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: google.spanner.admin.database.v1.EncryptionInfo, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this EncryptionInfo to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };
                    }

                    namespace EncryptionInfo {

                        /** Type enum. */
                        enum Type {
                            TYPE_UNSPECIFIED = 0,
                            GOOGLE_DEFAULT_ENCRYPTION = 1,
                            CUSTOMER_MANAGED_ENCRYPTION = 2
                        }
                    }

                    /** DatabaseDialect enum. */
                    enum DatabaseDialect {
                        DATABASE_DIALECT_UNSPECIFIED = 0,
                        GOOGLE_STANDARD_SQL = 1,
                        POSTGRESQL = 2
                    }

                    /** Represents a DatabaseAdmin */
                    class DatabaseAdmin extends $protobuf.rpc.Service {

                        /**
                         * Constructs a new DatabaseAdmin service.
                         * @param rpcImpl RPC implementation
                         * @param [requestDelimited=false] Whether requests are length-delimited
                         * @param [responseDelimited=false] Whether responses are length-delimited
                         */
                        constructor(rpcImpl: $protobuf.RPCImpl, requestDelimited?: boolean, responseDelimited?: boolean);

                        /**
                         * Creates new DatabaseAdmin service using the specified rpc implementation.
                         * @param rpcImpl RPC implementation
                         * @param [requestDelimited=false] Whether requests are length-delimited
                         * @param [responseDelimited=false] Whether responses are length-delimited
                         * @returns RPC service. Useful where requests and/or responses are streamed.
                         */
                        public static create(rpcImpl: $protobuf.RPCImpl, requestDelimited?: boolean, responseDelimited?: boolean): DatabaseAdmin;

                        /**
                         * Calls ListDatabases.
                         * @param request ListDatabasesRequest message or plain object
                         * @param callback Node-style callback called with the error, if any, and ListDatabasesResponse
                         */
                        public listDatabases(request: google.spanner.admin.database.v1.IListDatabasesRequest, callback: google.spanner.admin.database.v1.DatabaseAdmin.ListDatabasesCallback): void;

                        /**
                         * Calls ListDatabases.
                         * @param request ListDatabasesRequest message or plain object
                         * @returns Promise
                         */
                        public listDatabases(request: google.spanner.admin.database.v1.IListDatabasesRequest): Promise<google.spanner.admin.database.v1.ListDatabasesResponse>;

                        /**
                         * Calls CreateDatabase.
                         * @param request CreateDatabaseRequest message or plain object
                         * @param callback Node-style callback called with the error, if any, and Operation
                         */
                        public createDatabase(request: google.spanner.admin.database.v1.ICreateDatabaseRequest, callback: google.spanner.admin.database.v1.DatabaseAdmin.CreateDatabaseCallback): void;

                        /**
                         * Calls CreateDatabase.
                         * @param request CreateDatabaseRequest message or plain object
                         * @returns Promise
                         */
                        public createDatabase(request: google.spanner.admin.database.v1.ICreateDatabaseRequest): Promise<google.longrunning.Operation>;

                        /**
                         * Calls GetDatabase.
                         * @param request GetDatabaseRequest message or plain object
                         * @param callback Node-style callback called with the error, if any, and Database
                         */
                        public getDatabase(request: google.spanner.admin.database.v1.IGetDatabaseRequest, callback: google.spanner.admin.database.v1.DatabaseAdmin.GetDatabaseCallback): void;

                        /**
                         * Calls GetDatabase.
                         * @param request GetDatabaseRequest message or plain object
                         * @returns Promise
                         */
                        public getDatabase(request: google.spanner.admin.database.v1.IGetDatabaseRequest): Promise<google.spanner.admin.database.v1.Database>;

                        /**
                         * Calls UpdateDatabaseDdl.
                         * @param request UpdateDatabaseDdlRequest message or plain object
                         * @param callback Node-style callback called with the error, if any, and Operation
                         */
                        public updateDatabaseDdl(request: google.spanner.admin.database.v1.IUpdateDatabaseDdlRequest, callback: google.spanner.admin.database.v1.DatabaseAdmin.UpdateDatabaseDdlCallback): void;

                        /**
                         * Calls UpdateDatabaseDdl.
                         * @param request UpdateDatabaseDdlRequest message or plain object
                         * @returns Promise
                         */
                        public updateDatabaseDdl(request: google.spanner.admin.database.v1.IUpdateDatabaseDdlRequest): Promise<google.longrunning.Operation>;

                        /**
                         * Calls DropDatabase.
                         * @param request DropDatabaseRequest message or plain object
                         * @param callback Node-style callback called with the error, if any, and Empty
                         */
                        public dropDatabase(request: google.spanner.admin.database.v1.IDropDatabaseRequest, callback: google.spanner.admin.database.v1.DatabaseAdmin.DropDatabaseCallback): void;

                        /**
                         * Calls DropDatabase.
                         * @param request DropDatabaseRequest message or plain object
                         * @returns Promise
                         */
                        public dropDatabase(request: google.spanner.admin.database.v1.IDropDatabaseRequest): Promise<google.protobuf.Empty>;

                        /**
                         * Calls GetDatabaseDdl.
                         * @param request GetDatabaseDdlRequest message or plain object
                         * @param callback Node-style callback called with the error, if any, and GetDatabaseDdlResponse
                         */
                        public getDatabaseDdl(request: google.spanner.admin.database.v1.IGetDatabaseDdlRequest, callback: google.spanner.admin.database.v1.DatabaseAdmin.GetDatabaseDdlCallback): void;

                        /**
                         * Calls GetDatabaseDdl.
                         * @param request GetDatabaseDdlRequest message or plain object
                         * @returns Promise
                         */
                        public getDatabaseDdl(request: google.spanner.admin.database.v1.IGetDatabaseDdlRequest): Promise<google.spanner.admin.database.v1.GetDatabaseDdlResponse>;

                        /**
                         * Calls SetIamPolicy.
                         * @param request SetIamPolicyRequest message or plain object
                         * @param callback Node-style callback called with the error, if any, and Policy
                         */
                        public setIamPolicy(request: google.iam.v1.ISetIamPolicyRequest, callback: google.spanner.admin.database.v1.DatabaseAdmin.SetIamPolicyCallback): void;

                        /**
                         * Calls SetIamPolicy.
                         * @param request SetIamPolicyRequest message or plain object
                         * @returns Promise
                         */
                        public setIamPolicy(request: google.iam.v1.ISetIamPolicyRequest): Promise<google.iam.v1.Policy>;

                        /**
                         * Calls GetIamPolicy.
                         * @param request GetIamPolicyRequest message or plain object
                         * @param callback Node-style callback called with the error, if any, and Policy
                         */
                        public getIamPolicy(request: google.iam.v1.IGetIamPolicyRequest, callback: google.spanner.admin.database.v1.DatabaseAdmin.GetIamPolicyCallback): void;

                        /**
                         * Calls GetIamPolicy.
                         * @param request GetIamPolicyRequest message or plain object
                         * @returns Promise
                         */
                        public getIamPolicy(request: google.iam.v1.IGetIamPolicyRequest): Promise<google.iam.v1.Policy>;

                        /**
                         * Calls TestIamPermissions.
                         * @param request TestIamPermissionsRequest message or plain object
                         * @param callback Node-style callback called with the error, if any, and TestIamPermissionsResponse
                         */
                        public testIamPermissions(request: google.iam.v1.ITestIamPermissionsRequest, callback: google.spanner.admin.database.v1.DatabaseAdmin.TestIamPermissionsCallback): void;

                        /**
                         * Calls TestIamPermissions.
                         * @param request TestIamPermissionsRequest message or plain object
                         * @returns Promise
                         */
                        public testIamPermissions(request: google.iam.v1.ITestIamPermissionsRequest): Promise<google.iam.v1.TestIamPermissionsResponse>;

                        /**
                         * Calls CreateBackup.
                         * @param request CreateBackupRequest message or plain object
                         * @param callback Node-style callback called with the error, if any, and Operation
                         */
                        public createBackup(request: google.spanner.admin.database.v1.ICreateBackupRequest, callback: google.spanner.admin.database.v1.DatabaseAdmin.CreateBackupCallback): void;

                        /**
                         * Calls CreateBackup.
                         * @param request CreateBackupRequest message or plain object
                         * @returns Promise
                         */
                        public createBackup(request: google.spanner.admin.database.v1.ICreateBackupRequest): Promise<google.longrunning.Operation>;

                        /**
                         * Calls CopyBackup.
                         * @param request CopyBackupRequest message or plain object
                         * @param callback Node-style callback called with the error, if any, and Operation
                         */
                        public copyBackup(request: google.spanner.admin.database.v1.ICopyBackupRequest, callback: google.spanner.admin.database.v1.DatabaseAdmin.CopyBackupCallback): void;

                        /**
                         * Calls CopyBackup.
                         * @param request CopyBackupRequest message or plain object
                         * @returns Promise
                         */
                        public copyBackup(request: google.spanner.admin.database.v1.ICopyBackupRequest): Promise<google.longrunning.Operation>;

                        /**
                         * Calls GetBackup.
                         * @param request GetBackupRequest message or plain object
                         * @param callback Node-style callback called with the error, if any, and Backup
                         */
                        public getBackup(request: google.spanner.admin.database.v1.IGetBackupRequest, callback: google.spanner.admin.database.v1.DatabaseAdmin.GetBackupCallback): void;

                        /**
                         * Calls GetBackup.
                         * @param request GetBackupRequest message or plain object
                         * @returns Promise
                         */
                        public getBackup(request: google.spanner.admin.database.v1.IGetBackupRequest): Promise<google.spanner.admin.database.v1.Backup>;

                        /**
                         * Calls UpdateBackup.
                         * @param request UpdateBackupRequest message or plain object
                         * @param callback Node-style callback called with the error, if any, and Backup
                         */
                        public updateBackup(request: google.spanner.admin.database.v1.IUpdateBackupRequest, callback: google.spanner.admin.database.v1.DatabaseAdmin.UpdateBackupCallback): void;

                        /**
                         * Calls UpdateBackup.
                         * @param request UpdateBackupRequest message or plain object
                         * @returns Promise
                         */
                        public updateBackup(request: google.spanner.admin.database.v1.IUpdateBackupRequest): Promise<google.spanner.admin.database.v1.Backup>;

                        /**
                         * Calls DeleteBackup.
                         * @param request DeleteBackupRequest message or plain object
                         * @param callback Node-style callback called with the error, if any, and Empty
                         */
                        public deleteBackup(request: google.spanner.admin.database.v1.IDeleteBackupRequest, callback: google.spanner.admin.database.v1.DatabaseAdmin.DeleteBackupCallback): void;

                        /**
                         * Calls DeleteBackup.
                         * @param request DeleteBackupRequest message or plain object
                         * @returns Promise
                         */
                        public deleteBackup(request: google.spanner.admin.database.v1.IDeleteBackupRequest): Promise<google.protobuf.Empty>;

                        /**
                         * Calls ListBackups.
                         * @param request ListBackupsRequest message or plain object
                         * @param callback Node-style callback called with the error, if any, and ListBackupsResponse
                         */
                        public listBackups(request: google.spanner.admin.database.v1.IListBackupsRequest, callback: google.spanner.admin.database.v1.DatabaseAdmin.ListBackupsCallback): void;

                        /**
                         * Calls ListBackups.
                         * @param request ListBackupsRequest message or plain object
                         * @returns Promise
                         */
                        public listBackups(request: google.spanner.admin.database.v1.IListBackupsRequest): Promise<google.spanner.admin.database.v1.ListBackupsResponse>;

                        /**
                         * Calls RestoreDatabase.
                         * @param request RestoreDatabaseRequest message or plain object
                         * @param callback Node-style callback called with the error, if any, and Operation
                         */
                        public restoreDatabase(request: google.spanner.admin.database.v1.IRestoreDatabaseRequest, callback: google.spanner.admin.database.v1.DatabaseAdmin.RestoreDatabaseCallback): void;

                        /**
                         * Calls RestoreDatabase.
                         * @param request RestoreDatabaseRequest message or plain object
                         * @returns Promise
                         */
                        public restoreDatabase(request: google.spanner.admin.database.v1.IRestoreDatabaseRequest): Promise<google.longrunning.Operation>;

                        /**
                         * Calls ListDatabaseOperations.
                         * @param request ListDatabaseOperationsRequest message or plain object
                         * @param callback Node-style callback called with the error, if any, and ListDatabaseOperationsResponse
                         */
                        public listDatabaseOperations(request: google.spanner.admin.database.v1.IListDatabaseOperationsRequest, callback: google.spanner.admin.database.v1.DatabaseAdmin.ListDatabaseOperationsCallback): void;

                        /**
                         * Calls ListDatabaseOperations.
                         * @param request ListDatabaseOperationsRequest message or plain object
                         * @returns Promise
                         */
                        public listDatabaseOperations(request: google.spanner.admin.database.v1.IListDatabaseOperationsRequest): Promise<google.spanner.admin.database.v1.ListDatabaseOperationsResponse>;

                        /**
                         * Calls ListBackupOperations.
                         * @param request ListBackupOperationsRequest message or plain object
                         * @param callback Node-style callback called with the error, if any, and ListBackupOperationsResponse
                         */
                        public listBackupOperations(request: google.spanner.admin.database.v1.IListBackupOperationsRequest, callback: google.spanner.admin.database.v1.DatabaseAdmin.ListBackupOperationsCallback): void;

                        /**
                         * Calls ListBackupOperations.
                         * @param request ListBackupOperationsRequest message or plain object
                         * @returns Promise
                         */
                        public listBackupOperations(request: google.spanner.admin.database.v1.IListBackupOperationsRequest): Promise<google.spanner.admin.database.v1.ListBackupOperationsResponse>;
                    }

                    namespace DatabaseAdmin {

                        /**
                         * Callback as used by {@link google.spanner.admin.database.v1.DatabaseAdmin#listDatabases}.
                         * @param error Error, if any
                         * @param [response] ListDatabasesResponse
                         */
                        type ListDatabasesCallback = (error: (Error|null), response?: google.spanner.admin.database.v1.ListDatabasesResponse) => void;

                        /**
                         * Callback as used by {@link google.spanner.admin.database.v1.DatabaseAdmin#createDatabase}.
                         * @param error Error, if any
                         * @param [response] Operation
                         */
                        type CreateDatabaseCallback = (error: (Error|null), response?: google.longrunning.Operation) => void;

                        /**
                         * Callback as used by {@link google.spanner.admin.database.v1.DatabaseAdmin#getDatabase}.
                         * @param error Error, if any
                         * @param [response] Database
                         */
                        type GetDatabaseCallback = (error: (Error|null), response?: google.spanner.admin.database.v1.Database) => void;

                        /**
                         * Callback as used by {@link google.spanner.admin.database.v1.DatabaseAdmin#updateDatabaseDdl}.
                         * @param error Error, if any
                         * @param [response] Operation
                         */
                        type UpdateDatabaseDdlCallback = (error: (Error|null), response?: google.longrunning.Operation) => void;

                        /**
                         * Callback as used by {@link google.spanner.admin.database.v1.DatabaseAdmin#dropDatabase}.
                         * @param error Error, if any
                         * @param [response] Empty
                         */
                        type DropDatabaseCallback = (error: (Error|null), response?: google.protobuf.Empty) => void;

                        /**
                         * Callback as used by {@link google.spanner.admin.database.v1.DatabaseAdmin#getDatabaseDdl}.
                         * @param error Error, if any
                         * @param [response] GetDatabaseDdlResponse
                         */
                        type GetDatabaseDdlCallback = (error: (Error|null), response?: google.spanner.admin.database.v1.GetDatabaseDdlResponse) => void;

                        /**
                         * Callback as used by {@link google.spanner.admin.database.v1.DatabaseAdmin#setIamPolicy}.
                         * @param error Error, if any
                         * @param [response] Policy
                         */
                        type SetIamPolicyCallback = (error: (Error|null), response?: google.iam.v1.Policy) => void;

                        /**
                         * Callback as used by {@link google.spanner.admin.database.v1.DatabaseAdmin#getIamPolicy}.
                         * @param error Error, if any
                         * @param [response] Policy
                         */
                        type GetIamPolicyCallback = (error: (Error|null), response?: google.iam.v1.Policy) => void;

                        /**
                         * Callback as used by {@link google.spanner.admin.database.v1.DatabaseAdmin#testIamPermissions}.
                         * @param error Error, if any
                         * @param [response] TestIamPermissionsResponse
                         */
                        type TestIamPermissionsCallback = (error: (Error|null), response?: google.iam.v1.TestIamPermissionsResponse) => void;

                        /**
                         * Callback as used by {@link google.spanner.admin.database.v1.DatabaseAdmin#createBackup}.
                         * @param error Error, if any
                         * @param [response] Operation
                         */
                        type CreateBackupCallback = (error: (Error|null), response?: google.longrunning.Operation) => void;

                        /**
                         * Callback as used by {@link google.spanner.admin.database.v1.DatabaseAdmin#copyBackup}.
                         * @param error Error, if any
                         * @param [response] Operation
                         */
                        type CopyBackupCallback = (error: (Error|null), response?: google.longrunning.Operation) => void;

                        /**
                         * Callback as used by {@link google.spanner.admin.database.v1.DatabaseAdmin#getBackup}.
                         * @param error Error, if any
                         * @param [response] Backup
                         */
                        type GetBackupCallback = (error: (Error|null), response?: google.spanner.admin.database.v1.Backup) => void;

                        /**
                         * Callback as used by {@link google.spanner.admin.database.v1.DatabaseAdmin#updateBackup}.
                         * @param error Error, if any
                         * @param [response] Backup
                         */
                        type UpdateBackupCallback = (error: (Error|null), response?: google.spanner.admin.database.v1.Backup) => void;

                        /**
                         * Callback as used by {@link google.spanner.admin.database.v1.DatabaseAdmin#deleteBackup}.
                         * @param error Error, if any
                         * @param [response] Empty
                         */
                        type DeleteBackupCallback = (error: (Error|null), response?: google.protobuf.Empty) => void;

                        /**
                         * Callback as used by {@link google.spanner.admin.database.v1.DatabaseAdmin#listBackups}.
                         * @param error Error, if any
                         * @param [response] ListBackupsResponse
                         */
                        type ListBackupsCallback = (error: (Error|null), response?: google.spanner.admin.database.v1.ListBackupsResponse) => void;

                        /**
                         * Callback as used by {@link google.spanner.admin.database.v1.DatabaseAdmin#restoreDatabase}.
                         * @param error Error, if any
                         * @param [response] Operation
                         */
                        type RestoreDatabaseCallback = (error: (Error|null), response?: google.longrunning.Operation) => void;

                        /**
                         * Callback as used by {@link google.spanner.admin.database.v1.DatabaseAdmin#listDatabaseOperations}.
                         * @param error Error, if any
                         * @param [response] ListDatabaseOperationsResponse
                         */
                        type ListDatabaseOperationsCallback = (error: (Error|null), response?: google.spanner.admin.database.v1.ListDatabaseOperationsResponse) => void;

                        /**
                         * Callback as used by {@link google.spanner.admin.database.v1.DatabaseAdmin#listBackupOperations}.
                         * @param error Error, if any
                         * @param [response] ListBackupOperationsResponse
                         */
                        type ListBackupOperationsCallback = (error: (Error|null), response?: google.spanner.admin.database.v1.ListBackupOperationsResponse) => void;
                    }

                    /** Properties of a RestoreInfo. */
                    interface IRestoreInfo {

                        /** RestoreInfo sourceType */
                        sourceType?: (google.spanner.admin.database.v1.RestoreSourceType|keyof typeof google.spanner.admin.database.v1.RestoreSourceType|null);

                        /** RestoreInfo backupInfo */
                        backupInfo?: (google.spanner.admin.database.v1.IBackupInfo|null);
                    }

                    /** Represents a RestoreInfo. */
                    class RestoreInfo implements IRestoreInfo {

                        /**
                         * Constructs a new RestoreInfo.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: google.spanner.admin.database.v1.IRestoreInfo);

                        /** RestoreInfo sourceType. */
                        public sourceType: (google.spanner.admin.database.v1.RestoreSourceType|keyof typeof google.spanner.admin.database.v1.RestoreSourceType);

                        /** RestoreInfo backupInfo. */
                        public backupInfo?: (google.spanner.admin.database.v1.IBackupInfo|null);

                        /** RestoreInfo sourceInfo. */
                        public sourceInfo?: "backupInfo";

                        /**
                         * Creates a new RestoreInfo instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns RestoreInfo instance
                         */
                        public static create(properties?: google.spanner.admin.database.v1.IRestoreInfo): google.spanner.admin.database.v1.RestoreInfo;

                        /**
                         * Encodes the specified RestoreInfo message. Does not implicitly {@link google.spanner.admin.database.v1.RestoreInfo.verify|verify} messages.
                         * @param message RestoreInfo message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: google.spanner.admin.database.v1.IRestoreInfo, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified RestoreInfo message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.RestoreInfo.verify|verify} messages.
                         * @param message RestoreInfo message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: google.spanner.admin.database.v1.IRestoreInfo, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes a RestoreInfo message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns RestoreInfo
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.RestoreInfo;

                        /**
                         * Decodes a RestoreInfo message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns RestoreInfo
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.RestoreInfo;

                        /**
                         * Verifies a RestoreInfo message.
                         * @param message Plain object to verify
                         * @returns `null` if valid, otherwise the reason why it is not
                         */
                        public static verify(message: { [k: string]: any }): (string|null);

                        /**
                         * Creates a RestoreInfo message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns RestoreInfo
                         */
                        public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.RestoreInfo;

                        /**
                         * Creates a plain object from a RestoreInfo message. Also converts values to other types if specified.
                         * @param message RestoreInfo
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: google.spanner.admin.database.v1.RestoreInfo, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this RestoreInfo to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };
                    }

                    /** Properties of a Database. */
                    interface IDatabase {

                        /** Database name */
                        name?: (string|null);

                        /** Database state */
                        state?: (google.spanner.admin.database.v1.Database.State|keyof typeof google.spanner.admin.database.v1.Database.State|null);

                        /** Database createTime */
                        createTime?: (google.protobuf.ITimestamp|null);

                        /** Database restoreInfo */
                        restoreInfo?: (google.spanner.admin.database.v1.IRestoreInfo|null);

                        /** Database encryptionConfig */
                        encryptionConfig?: (google.spanner.admin.database.v1.IEncryptionConfig|null);

                        /** Database encryptionInfo */
                        encryptionInfo?: (google.spanner.admin.database.v1.IEncryptionInfo[]|null);

                        /** Database versionRetentionPeriod */
                        versionRetentionPeriod?: (string|null);

                        /** Database earliestVersionTime */
                        earliestVersionTime?: (google.protobuf.ITimestamp|null);

                        /** Database defaultLeader */
                        defaultLeader?: (string|null);

                        /** Database databaseDialect */
                        databaseDialect?: (google.spanner.admin.database.v1.DatabaseDialect|keyof typeof google.spanner.admin.database.v1.DatabaseDialect|null);
                    }

                    /** Represents a Database. */
                    class Database implements IDatabase {

                        /**
                         * Constructs a new Database.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: google.spanner.admin.database.v1.IDatabase);

                        /** Database name. */
                        public name: string;

                        /** Database state. */
                        public state: (google.spanner.admin.database.v1.Database.State|keyof typeof google.spanner.admin.database.v1.Database.State);

                        /** Database createTime. */
                        public createTime?: (google.protobuf.ITimestamp|null);

                        /** Database restoreInfo. */
                        public restoreInfo?: (google.spanner.admin.database.v1.IRestoreInfo|null);

                        /** Database encryptionConfig. */
                        public encryptionConfig?: (google.spanner.admin.database.v1.IEncryptionConfig|null);

                        /** Database encryptionInfo. */
                        public encryptionInfo: google.spanner.admin.database.v1.IEncryptionInfo[];

                        /** Database versionRetentionPeriod. */
                        public versionRetentionPeriod: string;

                        /** Database earliestVersionTime. */
                        public earliestVersionTime?: (google.protobuf.ITimestamp|null);

                        /** Database defaultLeader. */
                        public defaultLeader: string;

                        /** Database databaseDialect. */
                        public databaseDialect: (google.spanner.admin.database.v1.DatabaseDialect|keyof typeof google.spanner.admin.database.v1.DatabaseDialect);

                        /**
                         * Creates a new Database instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns Database instance
                         */
                        public static create(properties?: google.spanner.admin.database.v1.IDatabase): google.spanner.admin.database.v1.Database;

                        /**
                         * Encodes the specified Database message. Does not implicitly {@link google.spanner.admin.database.v1.Database.verify|verify} messages.
                         * @param message Database message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: google.spanner.admin.database.v1.IDatabase, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified Database message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.Database.verify|verify} messages.
                         * @param message Database message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: google.spanner.admin.database.v1.IDatabase, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes a Database message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns Database
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.Database;

                        /**
                         * Decodes a Database message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns Database
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.Database;

                        /**
                         * Verifies a Database message.
                         * @param message Plain object to verify
                         * @returns `null` if valid, otherwise the reason why it is not
                         */
                        public static verify(message: { [k: string]: any }): (string|null);

                        /**
                         * Creates a Database message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns Database
                         */
                        public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.Database;

                        /**
                         * Creates a plain object from a Database message. Also converts values to other types if specified.
                         * @param message Database
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: google.spanner.admin.database.v1.Database, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this Database to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };
                    }

                    namespace Database {

                        /** State enum. */
                        enum State {
                            STATE_UNSPECIFIED = 0,
                            CREATING = 1,
                            READY = 2,
                            READY_OPTIMIZING = 3
                        }
                    }

                    /** Properties of a ListDatabasesRequest. */
                    interface IListDatabasesRequest {

                        /** ListDatabasesRequest parent */
                        parent?: (string|null);

                        /** ListDatabasesRequest pageSize */
                        pageSize?: (number|null);

                        /** ListDatabasesRequest pageToken */
                        pageToken?: (string|null);
                    }

                    /** Represents a ListDatabasesRequest. */
                    class ListDatabasesRequest implements IListDatabasesRequest {

                        /**
                         * Constructs a new ListDatabasesRequest.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: google.spanner.admin.database.v1.IListDatabasesRequest);

                        /** ListDatabasesRequest parent. */
                        public parent: string;

                        /** ListDatabasesRequest pageSize. */
                        public pageSize: number;

                        /** ListDatabasesRequest pageToken. */
                        public pageToken: string;

                        /**
                         * Creates a new ListDatabasesRequest instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns ListDatabasesRequest instance
                         */
                        public static create(properties?: google.spanner.admin.database.v1.IListDatabasesRequest): google.spanner.admin.database.v1.ListDatabasesRequest;

                        /**
                         * Encodes the specified ListDatabasesRequest message. Does not implicitly {@link google.spanner.admin.database.v1.ListDatabasesRequest.verify|verify} messages.
                         * @param message ListDatabasesRequest message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: google.spanner.admin.database.v1.IListDatabasesRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified ListDatabasesRequest message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.ListDatabasesRequest.verify|verify} messages.
                         * @param message ListDatabasesRequest message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: google.spanner.admin.database.v1.IListDatabasesRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes a ListDatabasesRequest message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns ListDatabasesRequest
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.ListDatabasesRequest;

                        /**
                         * Decodes a ListDatabasesRequest message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns ListDatabasesRequest
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.ListDatabasesRequest;

                        /**
                         * Verifies a ListDatabasesRequest message.
                         * @param message Plain object to verify
                         * @returns `null` if valid, otherwise the reason why it is not
                         */
                        public static verify(message: { [k: string]: any }): (string|null);

                        /**
                         * Creates a ListDatabasesRequest message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns ListDatabasesRequest
                         */
                        public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.ListDatabasesRequest;

                        /**
                         * Creates a plain object from a ListDatabasesRequest message. Also converts values to other types if specified.
                         * @param message ListDatabasesRequest
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: google.spanner.admin.database.v1.ListDatabasesRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this ListDatabasesRequest to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };
                    }

                    /** Properties of a ListDatabasesResponse. */
                    interface IListDatabasesResponse {

                        /** ListDatabasesResponse databases */
                        databases?: (google.spanner.admin.database.v1.IDatabase[]|null);

                        /** ListDatabasesResponse nextPageToken */
                        nextPageToken?: (string|null);
                    }

                    /** Represents a ListDatabasesResponse. */
                    class ListDatabasesResponse implements IListDatabasesResponse {

                        /**
                         * Constructs a new ListDatabasesResponse.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: google.spanner.admin.database.v1.IListDatabasesResponse);

                        /** ListDatabasesResponse databases. */
                        public databases: google.spanner.admin.database.v1.IDatabase[];

                        /** ListDatabasesResponse nextPageToken. */
                        public nextPageToken: string;

                        /**
                         * Creates a new ListDatabasesResponse instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns ListDatabasesResponse instance
                         */
                        public static create(properties?: google.spanner.admin.database.v1.IListDatabasesResponse): google.spanner.admin.database.v1.ListDatabasesResponse;

                        /**
                         * Encodes the specified ListDatabasesResponse message. Does not implicitly {@link google.spanner.admin.database.v1.ListDatabasesResponse.verify|verify} messages.
                         * @param message ListDatabasesResponse message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: google.spanner.admin.database.v1.IListDatabasesResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified ListDatabasesResponse message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.ListDatabasesResponse.verify|verify} messages.
                         * @param message ListDatabasesResponse message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: google.spanner.admin.database.v1.IListDatabasesResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes a ListDatabasesResponse message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns ListDatabasesResponse
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.ListDatabasesResponse;

                        /**
                         * Decodes a ListDatabasesResponse message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns ListDatabasesResponse
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.ListDatabasesResponse;

                        /**
                         * Verifies a ListDatabasesResponse message.
                         * @param message Plain object to verify
                         * @returns `null` if valid, otherwise the reason why it is not
                         */
                        public static verify(message: { [k: string]: any }): (string|null);

                        /**
                         * Creates a ListDatabasesResponse message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns ListDatabasesResponse
                         */
                        public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.ListDatabasesResponse;

                        /**
                         * Creates a plain object from a ListDatabasesResponse message. Also converts values to other types if specified.
                         * @param message ListDatabasesResponse
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: google.spanner.admin.database.v1.ListDatabasesResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this ListDatabasesResponse to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };
                    }

                    /** Properties of a CreateDatabaseRequest. */
                    interface ICreateDatabaseRequest {

                        /** CreateDatabaseRequest parent */
                        parent?: (string|null);

                        /** CreateDatabaseRequest createStatement */
                        createStatement?: (string|null);

                        /** CreateDatabaseRequest extraStatements */
                        extraStatements?: (string[]|null);

                        /** CreateDatabaseRequest encryptionConfig */
                        encryptionConfig?: (google.spanner.admin.database.v1.IEncryptionConfig|null);

                        /** CreateDatabaseRequest databaseDialect */
                        databaseDialect?: (google.spanner.admin.database.v1.DatabaseDialect|keyof typeof google.spanner.admin.database.v1.DatabaseDialect|null);
                    }

                    /** Represents a CreateDatabaseRequest. */
                    class CreateDatabaseRequest implements ICreateDatabaseRequest {

                        /**
                         * Constructs a new CreateDatabaseRequest.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: google.spanner.admin.database.v1.ICreateDatabaseRequest);

                        /** CreateDatabaseRequest parent. */
                        public parent: string;

                        /** CreateDatabaseRequest createStatement. */
                        public createStatement: string;

                        /** CreateDatabaseRequest extraStatements. */
                        public extraStatements: string[];

                        /** CreateDatabaseRequest encryptionConfig. */
                        public encryptionConfig?: (google.spanner.admin.database.v1.IEncryptionConfig|null);

                        /** CreateDatabaseRequest databaseDialect. */
                        public databaseDialect: (google.spanner.admin.database.v1.DatabaseDialect|keyof typeof google.spanner.admin.database.v1.DatabaseDialect);

                        /**
                         * Creates a new CreateDatabaseRequest instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns CreateDatabaseRequest instance
                         */
                        public static create(properties?: google.spanner.admin.database.v1.ICreateDatabaseRequest): google.spanner.admin.database.v1.CreateDatabaseRequest;

                        /**
                         * Encodes the specified CreateDatabaseRequest message. Does not implicitly {@link google.spanner.admin.database.v1.CreateDatabaseRequest.verify|verify} messages.
                         * @param message CreateDatabaseRequest message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: google.spanner.admin.database.v1.ICreateDatabaseRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified CreateDatabaseRequest message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.CreateDatabaseRequest.verify|verify} messages.
                         * @param message CreateDatabaseRequest message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: google.spanner.admin.database.v1.ICreateDatabaseRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes a CreateDatabaseRequest message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns CreateDatabaseRequest
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.CreateDatabaseRequest;

                        /**
                         * Decodes a CreateDatabaseRequest message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns CreateDatabaseRequest
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.CreateDatabaseRequest;

                        /**
                         * Verifies a CreateDatabaseRequest message.
                         * @param message Plain object to verify
                         * @returns `null` if valid, otherwise the reason why it is not
                         */
                        public static verify(message: { [k: string]: any }): (string|null);

                        /**
                         * Creates a CreateDatabaseRequest message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns CreateDatabaseRequest
                         */
                        public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.CreateDatabaseRequest;

                        /**
                         * Creates a plain object from a CreateDatabaseRequest message. Also converts values to other types if specified.
                         * @param message CreateDatabaseRequest
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: google.spanner.admin.database.v1.CreateDatabaseRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this CreateDatabaseRequest to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };
                    }

                    /** Properties of a CreateDatabaseMetadata. */
                    interface ICreateDatabaseMetadata {

                        /** CreateDatabaseMetadata database */
                        database?: (string|null);
                    }

                    /** Represents a CreateDatabaseMetadata. */
                    class CreateDatabaseMetadata implements ICreateDatabaseMetadata {

                        /**
                         * Constructs a new CreateDatabaseMetadata.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: google.spanner.admin.database.v1.ICreateDatabaseMetadata);

                        /** CreateDatabaseMetadata database. */
                        public database: string;

                        /**
                         * Creates a new CreateDatabaseMetadata instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns CreateDatabaseMetadata instance
                         */
                        public static create(properties?: google.spanner.admin.database.v1.ICreateDatabaseMetadata): google.spanner.admin.database.v1.CreateDatabaseMetadata;

                        /**
                         * Encodes the specified CreateDatabaseMetadata message. Does not implicitly {@link google.spanner.admin.database.v1.CreateDatabaseMetadata.verify|verify} messages.
                         * @param message CreateDatabaseMetadata message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: google.spanner.admin.database.v1.ICreateDatabaseMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified CreateDatabaseMetadata message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.CreateDatabaseMetadata.verify|verify} messages.
                         * @param message CreateDatabaseMetadata message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: google.spanner.admin.database.v1.ICreateDatabaseMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes a CreateDatabaseMetadata message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns CreateDatabaseMetadata
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.CreateDatabaseMetadata;

                        /**
                         * Decodes a CreateDatabaseMetadata message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns CreateDatabaseMetadata
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.CreateDatabaseMetadata;

                        /**
                         * Verifies a CreateDatabaseMetadata message.
                         * @param message Plain object to verify
                         * @returns `null` if valid, otherwise the reason why it is not
                         */
                        public static verify(message: { [k: string]: any }): (string|null);

                        /**
                         * Creates a CreateDatabaseMetadata message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns CreateDatabaseMetadata
                         */
                        public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.CreateDatabaseMetadata;

                        /**
                         * Creates a plain object from a CreateDatabaseMetadata message. Also converts values to other types if specified.
                         * @param message CreateDatabaseMetadata
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: google.spanner.admin.database.v1.CreateDatabaseMetadata, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this CreateDatabaseMetadata to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };
                    }

                    /** Properties of a GetDatabaseRequest. */
                    interface IGetDatabaseRequest {

                        /** GetDatabaseRequest name */
                        name?: (string|null);
                    }

                    /** Represents a GetDatabaseRequest. */
                    class GetDatabaseRequest implements IGetDatabaseRequest {

                        /**
                         * Constructs a new GetDatabaseRequest.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: google.spanner.admin.database.v1.IGetDatabaseRequest);

                        /** GetDatabaseRequest name. */
                        public name: string;

                        /**
                         * Creates a new GetDatabaseRequest instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns GetDatabaseRequest instance
                         */
                        public static create(properties?: google.spanner.admin.database.v1.IGetDatabaseRequest): google.spanner.admin.database.v1.GetDatabaseRequest;

                        /**
                         * Encodes the specified GetDatabaseRequest message. Does not implicitly {@link google.spanner.admin.database.v1.GetDatabaseRequest.verify|verify} messages.
                         * @param message GetDatabaseRequest message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: google.spanner.admin.database.v1.IGetDatabaseRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified GetDatabaseRequest message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.GetDatabaseRequest.verify|verify} messages.
                         * @param message GetDatabaseRequest message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: google.spanner.admin.database.v1.IGetDatabaseRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes a GetDatabaseRequest message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns GetDatabaseRequest
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.GetDatabaseRequest;

                        /**
                         * Decodes a GetDatabaseRequest message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns GetDatabaseRequest
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.GetDatabaseRequest;

                        /**
                         * Verifies a GetDatabaseRequest message.
                         * @param message Plain object to verify
                         * @returns `null` if valid, otherwise the reason why it is not
                         */
                        public static verify(message: { [k: string]: any }): (string|null);

                        /**
                         * Creates a GetDatabaseRequest message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns GetDatabaseRequest
                         */
                        public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.GetDatabaseRequest;

                        /**
                         * Creates a plain object from a GetDatabaseRequest message. Also converts values to other types if specified.
                         * @param message GetDatabaseRequest
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: google.spanner.admin.database.v1.GetDatabaseRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this GetDatabaseRequest to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };
                    }

                    /** Properties of an UpdateDatabaseDdlRequest. */
                    interface IUpdateDatabaseDdlRequest {

                        /** UpdateDatabaseDdlRequest database */
                        database?: (string|null);

                        /** UpdateDatabaseDdlRequest statements */
                        statements?: (string[]|null);

                        /** UpdateDatabaseDdlRequest operationId */
                        operationId?: (string|null);
                    }

                    /** Represents an UpdateDatabaseDdlRequest. */
                    class UpdateDatabaseDdlRequest implements IUpdateDatabaseDdlRequest {

                        /**
                         * Constructs a new UpdateDatabaseDdlRequest.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: google.spanner.admin.database.v1.IUpdateDatabaseDdlRequest);

                        /** UpdateDatabaseDdlRequest database. */
                        public database: string;

                        /** UpdateDatabaseDdlRequest statements. */
                        public statements: string[];

                        /** UpdateDatabaseDdlRequest operationId. */
                        public operationId: string;

                        /**
                         * Creates a new UpdateDatabaseDdlRequest instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns UpdateDatabaseDdlRequest instance
                         */
                        public static create(properties?: google.spanner.admin.database.v1.IUpdateDatabaseDdlRequest): google.spanner.admin.database.v1.UpdateDatabaseDdlRequest;

                        /**
                         * Encodes the specified UpdateDatabaseDdlRequest message. Does not implicitly {@link google.spanner.admin.database.v1.UpdateDatabaseDdlRequest.verify|verify} messages.
                         * @param message UpdateDatabaseDdlRequest message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: google.spanner.admin.database.v1.IUpdateDatabaseDdlRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified UpdateDatabaseDdlRequest message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.UpdateDatabaseDdlRequest.verify|verify} messages.
                         * @param message UpdateDatabaseDdlRequest message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: google.spanner.admin.database.v1.IUpdateDatabaseDdlRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes an UpdateDatabaseDdlRequest message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns UpdateDatabaseDdlRequest
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.UpdateDatabaseDdlRequest;

                        /**
                         * Decodes an UpdateDatabaseDdlRequest message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns UpdateDatabaseDdlRequest
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.UpdateDatabaseDdlRequest;

                        /**
                         * Verifies an UpdateDatabaseDdlRequest message.
                         * @param message Plain object to verify
                         * @returns `null` if valid, otherwise the reason why it is not
                         */
                        public static verify(message: { [k: string]: any }): (string|null);

                        /**
                         * Creates an UpdateDatabaseDdlRequest message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns UpdateDatabaseDdlRequest
                         */
                        public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.UpdateDatabaseDdlRequest;

                        /**
                         * Creates a plain object from an UpdateDatabaseDdlRequest message. Also converts values to other types if specified.
                         * @param message UpdateDatabaseDdlRequest
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: google.spanner.admin.database.v1.UpdateDatabaseDdlRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this UpdateDatabaseDdlRequest to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };
                    }

                    /** Properties of an UpdateDatabaseDdlMetadata. */
                    interface IUpdateDatabaseDdlMetadata {

                        /** UpdateDatabaseDdlMetadata database */
                        database?: (string|null);

                        /** UpdateDatabaseDdlMetadata statements */
                        statements?: (string[]|null);

                        /** UpdateDatabaseDdlMetadata commitTimestamps */
                        commitTimestamps?: (google.protobuf.ITimestamp[]|null);

                        /** UpdateDatabaseDdlMetadata throttled */
                        throttled?: (boolean|null);

                        /** UpdateDatabaseDdlMetadata progress */
                        progress?: (google.spanner.admin.database.v1.IOperationProgress[]|null);
                    }

                    /** Represents an UpdateDatabaseDdlMetadata. */
                    class UpdateDatabaseDdlMetadata implements IUpdateDatabaseDdlMetadata {

                        /**
                         * Constructs a new UpdateDatabaseDdlMetadata.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: google.spanner.admin.database.v1.IUpdateDatabaseDdlMetadata);

                        /** UpdateDatabaseDdlMetadata database. */
                        public database: string;

                        /** UpdateDatabaseDdlMetadata statements. */
                        public statements: string[];

                        /** UpdateDatabaseDdlMetadata commitTimestamps. */
                        public commitTimestamps: google.protobuf.ITimestamp[];

                        /** UpdateDatabaseDdlMetadata throttled. */
                        public throttled: boolean;

                        /** UpdateDatabaseDdlMetadata progress. */
                        public progress: google.spanner.admin.database.v1.IOperationProgress[];

                        /**
                         * Creates a new UpdateDatabaseDdlMetadata instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns UpdateDatabaseDdlMetadata instance
                         */
                        public static create(properties?: google.spanner.admin.database.v1.IUpdateDatabaseDdlMetadata): google.spanner.admin.database.v1.UpdateDatabaseDdlMetadata;

                        /**
                         * Encodes the specified UpdateDatabaseDdlMetadata message. Does not implicitly {@link google.spanner.admin.database.v1.UpdateDatabaseDdlMetadata.verify|verify} messages.
                         * @param message UpdateDatabaseDdlMetadata message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: google.spanner.admin.database.v1.IUpdateDatabaseDdlMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified UpdateDatabaseDdlMetadata message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.UpdateDatabaseDdlMetadata.verify|verify} messages.
                         * @param message UpdateDatabaseDdlMetadata message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: google.spanner.admin.database.v1.IUpdateDatabaseDdlMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes an UpdateDatabaseDdlMetadata message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns UpdateDatabaseDdlMetadata
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.UpdateDatabaseDdlMetadata;

                        /**
                         * Decodes an UpdateDatabaseDdlMetadata message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns UpdateDatabaseDdlMetadata
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.UpdateDatabaseDdlMetadata;

                        /**
                         * Verifies an UpdateDatabaseDdlMetadata message.
                         * @param message Plain object to verify
                         * @returns `null` if valid, otherwise the reason why it is not
                         */
                        public static verify(message: { [k: string]: any }): (string|null);

                        /**
                         * Creates an UpdateDatabaseDdlMetadata message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns UpdateDatabaseDdlMetadata
                         */
                        public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.UpdateDatabaseDdlMetadata;

                        /**
                         * Creates a plain object from an UpdateDatabaseDdlMetadata message. Also converts values to other types if specified.
                         * @param message UpdateDatabaseDdlMetadata
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: google.spanner.admin.database.v1.UpdateDatabaseDdlMetadata, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this UpdateDatabaseDdlMetadata to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };
                    }

                    /** Properties of a DropDatabaseRequest. */
                    interface IDropDatabaseRequest {

                        /** DropDatabaseRequest database */
                        database?: (string|null);
                    }

                    /** Represents a DropDatabaseRequest. */
                    class DropDatabaseRequest implements IDropDatabaseRequest {

                        /**
                         * Constructs a new DropDatabaseRequest.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: google.spanner.admin.database.v1.IDropDatabaseRequest);

                        /** DropDatabaseRequest database. */
                        public database: string;

                        /**
                         * Creates a new DropDatabaseRequest instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns DropDatabaseRequest instance
                         */
                        public static create(properties?: google.spanner.admin.database.v1.IDropDatabaseRequest): google.spanner.admin.database.v1.DropDatabaseRequest;

                        /**
                         * Encodes the specified DropDatabaseRequest message. Does not implicitly {@link google.spanner.admin.database.v1.DropDatabaseRequest.verify|verify} messages.
                         * @param message DropDatabaseRequest message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: google.spanner.admin.database.v1.IDropDatabaseRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified DropDatabaseRequest message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.DropDatabaseRequest.verify|verify} messages.
                         * @param message DropDatabaseRequest message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: google.spanner.admin.database.v1.IDropDatabaseRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes a DropDatabaseRequest message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns DropDatabaseRequest
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.DropDatabaseRequest;

                        /**
                         * Decodes a DropDatabaseRequest message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns DropDatabaseRequest
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.DropDatabaseRequest;

                        /**
                         * Verifies a DropDatabaseRequest message.
                         * @param message Plain object to verify
                         * @returns `null` if valid, otherwise the reason why it is not
                         */
                        public static verify(message: { [k: string]: any }): (string|null);

                        /**
                         * Creates a DropDatabaseRequest message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns DropDatabaseRequest
                         */
                        public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.DropDatabaseRequest;

                        /**
                         * Creates a plain object from a DropDatabaseRequest message. Also converts values to other types if specified.
                         * @param message DropDatabaseRequest
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: google.spanner.admin.database.v1.DropDatabaseRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this DropDatabaseRequest to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };
                    }

                    /** Properties of a GetDatabaseDdlRequest. */
                    interface IGetDatabaseDdlRequest {

                        /** GetDatabaseDdlRequest database */
                        database?: (string|null);
                    }

                    /** Represents a GetDatabaseDdlRequest. */
                    class GetDatabaseDdlRequest implements IGetDatabaseDdlRequest {

                        /**
                         * Constructs a new GetDatabaseDdlRequest.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: google.spanner.admin.database.v1.IGetDatabaseDdlRequest);

                        /** GetDatabaseDdlRequest database. */
                        public database: string;

                        /**
                         * Creates a new GetDatabaseDdlRequest instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns GetDatabaseDdlRequest instance
                         */
                        public static create(properties?: google.spanner.admin.database.v1.IGetDatabaseDdlRequest): google.spanner.admin.database.v1.GetDatabaseDdlRequest;

                        /**
                         * Encodes the specified GetDatabaseDdlRequest message. Does not implicitly {@link google.spanner.admin.database.v1.GetDatabaseDdlRequest.verify|verify} messages.
                         * @param message GetDatabaseDdlRequest message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: google.spanner.admin.database.v1.IGetDatabaseDdlRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified GetDatabaseDdlRequest message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.GetDatabaseDdlRequest.verify|verify} messages.
                         * @param message GetDatabaseDdlRequest message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: google.spanner.admin.database.v1.IGetDatabaseDdlRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes a GetDatabaseDdlRequest message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns GetDatabaseDdlRequest
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.GetDatabaseDdlRequest;

                        /**
                         * Decodes a GetDatabaseDdlRequest message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns GetDatabaseDdlRequest
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.GetDatabaseDdlRequest;

                        /**
                         * Verifies a GetDatabaseDdlRequest message.
                         * @param message Plain object to verify
                         * @returns `null` if valid, otherwise the reason why it is not
                         */
                        public static verify(message: { [k: string]: any }): (string|null);

                        /**
                         * Creates a GetDatabaseDdlRequest message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns GetDatabaseDdlRequest
                         */
                        public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.GetDatabaseDdlRequest;

                        /**
                         * Creates a plain object from a GetDatabaseDdlRequest message. Also converts values to other types if specified.
                         * @param message GetDatabaseDdlRequest
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: google.spanner.admin.database.v1.GetDatabaseDdlRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this GetDatabaseDdlRequest to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };
                    }

                    /** Properties of a GetDatabaseDdlResponse. */
                    interface IGetDatabaseDdlResponse {

                        /** GetDatabaseDdlResponse statements */
                        statements?: (string[]|null);
                    }

                    /** Represents a GetDatabaseDdlResponse. */
                    class GetDatabaseDdlResponse implements IGetDatabaseDdlResponse {

                        /**
                         * Constructs a new GetDatabaseDdlResponse.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: google.spanner.admin.database.v1.IGetDatabaseDdlResponse);

                        /** GetDatabaseDdlResponse statements. */
                        public statements: string[];

                        /**
                         * Creates a new GetDatabaseDdlResponse instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns GetDatabaseDdlResponse instance
                         */
                        public static create(properties?: google.spanner.admin.database.v1.IGetDatabaseDdlResponse): google.spanner.admin.database.v1.GetDatabaseDdlResponse;

                        /**
                         * Encodes the specified GetDatabaseDdlResponse message. Does not implicitly {@link google.spanner.admin.database.v1.GetDatabaseDdlResponse.verify|verify} messages.
                         * @param message GetDatabaseDdlResponse message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: google.spanner.admin.database.v1.IGetDatabaseDdlResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified GetDatabaseDdlResponse message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.GetDatabaseDdlResponse.verify|verify} messages.
                         * @param message GetDatabaseDdlResponse message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: google.spanner.admin.database.v1.IGetDatabaseDdlResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes a GetDatabaseDdlResponse message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns GetDatabaseDdlResponse
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.GetDatabaseDdlResponse;

                        /**
                         * Decodes a GetDatabaseDdlResponse message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns GetDatabaseDdlResponse
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.GetDatabaseDdlResponse;

                        /**
                         * Verifies a GetDatabaseDdlResponse message.
                         * @param message Plain object to verify
                         * @returns `null` if valid, otherwise the reason why it is not
                         */
                        public static verify(message: { [k: string]: any }): (string|null);

                        /**
                         * Creates a GetDatabaseDdlResponse message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns GetDatabaseDdlResponse
                         */
                        public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.GetDatabaseDdlResponse;

                        /**
                         * Creates a plain object from a GetDatabaseDdlResponse message. Also converts values to other types if specified.
                         * @param message GetDatabaseDdlResponse
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: google.spanner.admin.database.v1.GetDatabaseDdlResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this GetDatabaseDdlResponse to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };
                    }

                    /** Properties of a ListDatabaseOperationsRequest. */
                    interface IListDatabaseOperationsRequest {

                        /** ListDatabaseOperationsRequest parent */
                        parent?: (string|null);

                        /** ListDatabaseOperationsRequest filter */
                        filter?: (string|null);

                        /** ListDatabaseOperationsRequest pageSize */
                        pageSize?: (number|null);

                        /** ListDatabaseOperationsRequest pageToken */
                        pageToken?: (string|null);
                    }

                    /** Represents a ListDatabaseOperationsRequest. */
                    class ListDatabaseOperationsRequest implements IListDatabaseOperationsRequest {

                        /**
                         * Constructs a new ListDatabaseOperationsRequest.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: google.spanner.admin.database.v1.IListDatabaseOperationsRequest);

                        /** ListDatabaseOperationsRequest parent. */
                        public parent: string;

                        /** ListDatabaseOperationsRequest filter. */
                        public filter: string;

                        /** ListDatabaseOperationsRequest pageSize. */
                        public pageSize: number;

                        /** ListDatabaseOperationsRequest pageToken. */
                        public pageToken: string;

                        /**
                         * Creates a new ListDatabaseOperationsRequest instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns ListDatabaseOperationsRequest instance
                         */
                        public static create(properties?: google.spanner.admin.database.v1.IListDatabaseOperationsRequest): google.spanner.admin.database.v1.ListDatabaseOperationsRequest;

                        /**
                         * Encodes the specified ListDatabaseOperationsRequest message. Does not implicitly {@link google.spanner.admin.database.v1.ListDatabaseOperationsRequest.verify|verify} messages.
                         * @param message ListDatabaseOperationsRequest message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: google.spanner.admin.database.v1.IListDatabaseOperationsRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified ListDatabaseOperationsRequest message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.ListDatabaseOperationsRequest.verify|verify} messages.
                         * @param message ListDatabaseOperationsRequest message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: google.spanner.admin.database.v1.IListDatabaseOperationsRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes a ListDatabaseOperationsRequest message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns ListDatabaseOperationsRequest
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.ListDatabaseOperationsRequest;

                        /**
                         * Decodes a ListDatabaseOperationsRequest message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns ListDatabaseOperationsRequest
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.ListDatabaseOperationsRequest;

                        /**
                         * Verifies a ListDatabaseOperationsRequest message.
                         * @param message Plain object to verify
                         * @returns `null` if valid, otherwise the reason why it is not
                         */
                        public static verify(message: { [k: string]: any }): (string|null);

                        /**
                         * Creates a ListDatabaseOperationsRequest message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns ListDatabaseOperationsRequest
                         */
                        public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.ListDatabaseOperationsRequest;

                        /**
                         * Creates a plain object from a ListDatabaseOperationsRequest message. Also converts values to other types if specified.
                         * @param message ListDatabaseOperationsRequest
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: google.spanner.admin.database.v1.ListDatabaseOperationsRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this ListDatabaseOperationsRequest to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };
                    }

                    /** Properties of a ListDatabaseOperationsResponse. */
                    interface IListDatabaseOperationsResponse {

                        /** ListDatabaseOperationsResponse operations */
                        operations?: (google.longrunning.IOperation[]|null);

                        /** ListDatabaseOperationsResponse nextPageToken */
                        nextPageToken?: (string|null);
                    }

                    /** Represents a ListDatabaseOperationsResponse. */
                    class ListDatabaseOperationsResponse implements IListDatabaseOperationsResponse {

                        /**
                         * Constructs a new ListDatabaseOperationsResponse.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: google.spanner.admin.database.v1.IListDatabaseOperationsResponse);

                        /** ListDatabaseOperationsResponse operations. */
                        public operations: google.longrunning.IOperation[];

                        /** ListDatabaseOperationsResponse nextPageToken. */
                        public nextPageToken: string;

                        /**
                         * Creates a new ListDatabaseOperationsResponse instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns ListDatabaseOperationsResponse instance
                         */
                        public static create(properties?: google.spanner.admin.database.v1.IListDatabaseOperationsResponse): google.spanner.admin.database.v1.ListDatabaseOperationsResponse;

                        /**
                         * Encodes the specified ListDatabaseOperationsResponse message. Does not implicitly {@link google.spanner.admin.database.v1.ListDatabaseOperationsResponse.verify|verify} messages.
                         * @param message ListDatabaseOperationsResponse message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: google.spanner.admin.database.v1.IListDatabaseOperationsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified ListDatabaseOperationsResponse message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.ListDatabaseOperationsResponse.verify|verify} messages.
                         * @param message ListDatabaseOperationsResponse message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: google.spanner.admin.database.v1.IListDatabaseOperationsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes a ListDatabaseOperationsResponse message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns ListDatabaseOperationsResponse
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.ListDatabaseOperationsResponse;

                        /**
                         * Decodes a ListDatabaseOperationsResponse message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns ListDatabaseOperationsResponse
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.ListDatabaseOperationsResponse;

                        /**
                         * Verifies a ListDatabaseOperationsResponse message.
                         * @param message Plain object to verify
                         * @returns `null` if valid, otherwise the reason why it is not
                         */
                        public static verify(message: { [k: string]: any }): (string|null);

                        /**
                         * Creates a ListDatabaseOperationsResponse message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns ListDatabaseOperationsResponse
                         */
                        public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.ListDatabaseOperationsResponse;

                        /**
                         * Creates a plain object from a ListDatabaseOperationsResponse message. Also converts values to other types if specified.
                         * @param message ListDatabaseOperationsResponse
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: google.spanner.admin.database.v1.ListDatabaseOperationsResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this ListDatabaseOperationsResponse to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };
                    }

                    /** Properties of a RestoreDatabaseRequest. */
                    interface IRestoreDatabaseRequest {

                        /** RestoreDatabaseRequest parent */
                        parent?: (string|null);

                        /** RestoreDatabaseRequest databaseId */
                        databaseId?: (string|null);

                        /** RestoreDatabaseRequest backup */
                        backup?: (string|null);

                        /** RestoreDatabaseRequest encryptionConfig */
                        encryptionConfig?: (google.spanner.admin.database.v1.IRestoreDatabaseEncryptionConfig|null);
                    }

                    /** Represents a RestoreDatabaseRequest. */
                    class RestoreDatabaseRequest implements IRestoreDatabaseRequest {

                        /**
                         * Constructs a new RestoreDatabaseRequest.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: google.spanner.admin.database.v1.IRestoreDatabaseRequest);

                        /** RestoreDatabaseRequest parent. */
                        public parent: string;

                        /** RestoreDatabaseRequest databaseId. */
                        public databaseId: string;

                        /** RestoreDatabaseRequest backup. */
                        public backup?: (string|null);

                        /** RestoreDatabaseRequest encryptionConfig. */
                        public encryptionConfig?: (google.spanner.admin.database.v1.IRestoreDatabaseEncryptionConfig|null);

                        /** RestoreDatabaseRequest source. */
                        public source?: "backup";

                        /**
                         * Creates a new RestoreDatabaseRequest instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns RestoreDatabaseRequest instance
                         */
                        public static create(properties?: google.spanner.admin.database.v1.IRestoreDatabaseRequest): google.spanner.admin.database.v1.RestoreDatabaseRequest;

                        /**
                         * Encodes the specified RestoreDatabaseRequest message. Does not implicitly {@link google.spanner.admin.database.v1.RestoreDatabaseRequest.verify|verify} messages.
                         * @param message RestoreDatabaseRequest message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: google.spanner.admin.database.v1.IRestoreDatabaseRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified RestoreDatabaseRequest message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.RestoreDatabaseRequest.verify|verify} messages.
                         * @param message RestoreDatabaseRequest message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: google.spanner.admin.database.v1.IRestoreDatabaseRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes a RestoreDatabaseRequest message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns RestoreDatabaseRequest
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.RestoreDatabaseRequest;

                        /**
                         * Decodes a RestoreDatabaseRequest message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns RestoreDatabaseRequest
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.RestoreDatabaseRequest;

                        /**
                         * Verifies a RestoreDatabaseRequest message.
                         * @param message Plain object to verify
                         * @returns `null` if valid, otherwise the reason why it is not
                         */
                        public static verify(message: { [k: string]: any }): (string|null);

                        /**
                         * Creates a RestoreDatabaseRequest message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns RestoreDatabaseRequest
                         */
                        public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.RestoreDatabaseRequest;

                        /**
                         * Creates a plain object from a RestoreDatabaseRequest message. Also converts values to other types if specified.
                         * @param message RestoreDatabaseRequest
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: google.spanner.admin.database.v1.RestoreDatabaseRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this RestoreDatabaseRequest to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };
                    }

                    /** Properties of a RestoreDatabaseEncryptionConfig. */
                    interface IRestoreDatabaseEncryptionConfig {

                        /** RestoreDatabaseEncryptionConfig encryptionType */
                        encryptionType?: (google.spanner.admin.database.v1.RestoreDatabaseEncryptionConfig.EncryptionType|keyof typeof google.spanner.admin.database.v1.RestoreDatabaseEncryptionConfig.EncryptionType|null);

                        /** RestoreDatabaseEncryptionConfig kmsKeyName */
                        kmsKeyName?: (string|null);
                    }

                    /** Represents a RestoreDatabaseEncryptionConfig. */
                    class RestoreDatabaseEncryptionConfig implements IRestoreDatabaseEncryptionConfig {

                        /**
                         * Constructs a new RestoreDatabaseEncryptionConfig.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: google.spanner.admin.database.v1.IRestoreDatabaseEncryptionConfig);

                        /** RestoreDatabaseEncryptionConfig encryptionType. */
                        public encryptionType: (google.spanner.admin.database.v1.RestoreDatabaseEncryptionConfig.EncryptionType|keyof typeof google.spanner.admin.database.v1.RestoreDatabaseEncryptionConfig.EncryptionType);

                        /** RestoreDatabaseEncryptionConfig kmsKeyName. */
                        public kmsKeyName: string;

                        /**
                         * Creates a new RestoreDatabaseEncryptionConfig instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns RestoreDatabaseEncryptionConfig instance
                         */
                        public static create(properties?: google.spanner.admin.database.v1.IRestoreDatabaseEncryptionConfig): google.spanner.admin.database.v1.RestoreDatabaseEncryptionConfig;

                        /**
                         * Encodes the specified RestoreDatabaseEncryptionConfig message. Does not implicitly {@link google.spanner.admin.database.v1.RestoreDatabaseEncryptionConfig.verify|verify} messages.
                         * @param message RestoreDatabaseEncryptionConfig message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: google.spanner.admin.database.v1.IRestoreDatabaseEncryptionConfig, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified RestoreDatabaseEncryptionConfig message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.RestoreDatabaseEncryptionConfig.verify|verify} messages.
                         * @param message RestoreDatabaseEncryptionConfig message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: google.spanner.admin.database.v1.IRestoreDatabaseEncryptionConfig, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes a RestoreDatabaseEncryptionConfig message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns RestoreDatabaseEncryptionConfig
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.RestoreDatabaseEncryptionConfig;

                        /**
                         * Decodes a RestoreDatabaseEncryptionConfig message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns RestoreDatabaseEncryptionConfig
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.RestoreDatabaseEncryptionConfig;

                        /**
                         * Verifies a RestoreDatabaseEncryptionConfig message.
                         * @param message Plain object to verify
                         * @returns `null` if valid, otherwise the reason why it is not
                         */
                        public static verify(message: { [k: string]: any }): (string|null);

                        /**
                         * Creates a RestoreDatabaseEncryptionConfig message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns RestoreDatabaseEncryptionConfig
                         */
                        public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.RestoreDatabaseEncryptionConfig;

                        /**
                         * Creates a plain object from a RestoreDatabaseEncryptionConfig message. Also converts values to other types if specified.
                         * @param message RestoreDatabaseEncryptionConfig
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: google.spanner.admin.database.v1.RestoreDatabaseEncryptionConfig, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this RestoreDatabaseEncryptionConfig to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };
                    }

                    namespace RestoreDatabaseEncryptionConfig {

                        /** EncryptionType enum. */
                        enum EncryptionType {
                            ENCRYPTION_TYPE_UNSPECIFIED = 0,
                            USE_CONFIG_DEFAULT_OR_BACKUP_ENCRYPTION = 1,
                            GOOGLE_DEFAULT_ENCRYPTION = 2,
                            CUSTOMER_MANAGED_ENCRYPTION = 3
                        }
                    }

                    /** Properties of a RestoreDatabaseMetadata. */
                    interface IRestoreDatabaseMetadata {

                        /** RestoreDatabaseMetadata name */
                        name?: (string|null);

                        /** RestoreDatabaseMetadata sourceType */
                        sourceType?: (google.spanner.admin.database.v1.RestoreSourceType|keyof typeof google.spanner.admin.database.v1.RestoreSourceType|null);

                        /** RestoreDatabaseMetadata backupInfo */
                        backupInfo?: (google.spanner.admin.database.v1.IBackupInfo|null);

                        /** RestoreDatabaseMetadata progress */
                        progress?: (google.spanner.admin.database.v1.IOperationProgress|null);

                        /** RestoreDatabaseMetadata cancelTime */
                        cancelTime?: (google.protobuf.ITimestamp|null);

                        /** RestoreDatabaseMetadata optimizeDatabaseOperationName */
                        optimizeDatabaseOperationName?: (string|null);
                    }

                    /** Represents a RestoreDatabaseMetadata. */
                    class RestoreDatabaseMetadata implements IRestoreDatabaseMetadata {

                        /**
                         * Constructs a new RestoreDatabaseMetadata.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: google.spanner.admin.database.v1.IRestoreDatabaseMetadata);

                        /** RestoreDatabaseMetadata name. */
                        public name: string;

                        /** RestoreDatabaseMetadata sourceType. */
                        public sourceType: (google.spanner.admin.database.v1.RestoreSourceType|keyof typeof google.spanner.admin.database.v1.RestoreSourceType);

                        /** RestoreDatabaseMetadata backupInfo. */
                        public backupInfo?: (google.spanner.admin.database.v1.IBackupInfo|null);

                        /** RestoreDatabaseMetadata progress. */
                        public progress?: (google.spanner.admin.database.v1.IOperationProgress|null);

                        /** RestoreDatabaseMetadata cancelTime. */
                        public cancelTime?: (google.protobuf.ITimestamp|null);

                        /** RestoreDatabaseMetadata optimizeDatabaseOperationName. */
                        public optimizeDatabaseOperationName: string;

                        /** RestoreDatabaseMetadata sourceInfo. */
                        public sourceInfo?: "backupInfo";

                        /**
                         * Creates a new RestoreDatabaseMetadata instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns RestoreDatabaseMetadata instance
                         */
                        public static create(properties?: google.spanner.admin.database.v1.IRestoreDatabaseMetadata): google.spanner.admin.database.v1.RestoreDatabaseMetadata;

                        /**
                         * Encodes the specified RestoreDatabaseMetadata message. Does not implicitly {@link google.spanner.admin.database.v1.RestoreDatabaseMetadata.verify|verify} messages.
                         * @param message RestoreDatabaseMetadata message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: google.spanner.admin.database.v1.IRestoreDatabaseMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified RestoreDatabaseMetadata message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.RestoreDatabaseMetadata.verify|verify} messages.
                         * @param message RestoreDatabaseMetadata message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: google.spanner.admin.database.v1.IRestoreDatabaseMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes a RestoreDatabaseMetadata message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns RestoreDatabaseMetadata
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.RestoreDatabaseMetadata;

                        /**
                         * Decodes a RestoreDatabaseMetadata message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns RestoreDatabaseMetadata
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.RestoreDatabaseMetadata;

                        /**
                         * Verifies a RestoreDatabaseMetadata message.
                         * @param message Plain object to verify
                         * @returns `null` if valid, otherwise the reason why it is not
                         */
                        public static verify(message: { [k: string]: any }): (string|null);

                        /**
                         * Creates a RestoreDatabaseMetadata message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns RestoreDatabaseMetadata
                         */
                        public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.RestoreDatabaseMetadata;

                        /**
                         * Creates a plain object from a RestoreDatabaseMetadata message. Also converts values to other types if specified.
                         * @param message RestoreDatabaseMetadata
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: google.spanner.admin.database.v1.RestoreDatabaseMetadata, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this RestoreDatabaseMetadata to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };
                    }

                    /** Properties of an OptimizeRestoredDatabaseMetadata. */
                    interface IOptimizeRestoredDatabaseMetadata {

                        /** OptimizeRestoredDatabaseMetadata name */
                        name?: (string|null);

                        /** OptimizeRestoredDatabaseMetadata progress */
                        progress?: (google.spanner.admin.database.v1.IOperationProgress|null);
                    }

                    /** Represents an OptimizeRestoredDatabaseMetadata. */
                    class OptimizeRestoredDatabaseMetadata implements IOptimizeRestoredDatabaseMetadata {

                        /**
                         * Constructs a new OptimizeRestoredDatabaseMetadata.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: google.spanner.admin.database.v1.IOptimizeRestoredDatabaseMetadata);

                        /** OptimizeRestoredDatabaseMetadata name. */
                        public name: string;

                        /** OptimizeRestoredDatabaseMetadata progress. */
                        public progress?: (google.spanner.admin.database.v1.IOperationProgress|null);

                        /**
                         * Creates a new OptimizeRestoredDatabaseMetadata instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns OptimizeRestoredDatabaseMetadata instance
                         */
                        public static create(properties?: google.spanner.admin.database.v1.IOptimizeRestoredDatabaseMetadata): google.spanner.admin.database.v1.OptimizeRestoredDatabaseMetadata;

                        /**
                         * Encodes the specified OptimizeRestoredDatabaseMetadata message. Does not implicitly {@link google.spanner.admin.database.v1.OptimizeRestoredDatabaseMetadata.verify|verify} messages.
                         * @param message OptimizeRestoredDatabaseMetadata message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: google.spanner.admin.database.v1.IOptimizeRestoredDatabaseMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified OptimizeRestoredDatabaseMetadata message, length delimited. Does not implicitly {@link google.spanner.admin.database.v1.OptimizeRestoredDatabaseMetadata.verify|verify} messages.
                         * @param message OptimizeRestoredDatabaseMetadata message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: google.spanner.admin.database.v1.IOptimizeRestoredDatabaseMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes an OptimizeRestoredDatabaseMetadata message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns OptimizeRestoredDatabaseMetadata
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.database.v1.OptimizeRestoredDatabaseMetadata;

                        /**
                         * Decodes an OptimizeRestoredDatabaseMetadata message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns OptimizeRestoredDatabaseMetadata
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.database.v1.OptimizeRestoredDatabaseMetadata;

                        /**
                         * Verifies an OptimizeRestoredDatabaseMetadata message.
                         * @param message Plain object to verify
                         * @returns `null` if valid, otherwise the reason why it is not
                         */
                        public static verify(message: { [k: string]: any }): (string|null);

                        /**
                         * Creates an OptimizeRestoredDatabaseMetadata message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns OptimizeRestoredDatabaseMetadata
                         */
                        public static fromObject(object: { [k: string]: any }): google.spanner.admin.database.v1.OptimizeRestoredDatabaseMetadata;

                        /**
                         * Creates a plain object from an OptimizeRestoredDatabaseMetadata message. Also converts values to other types if specified.
                         * @param message OptimizeRestoredDatabaseMetadata
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: google.spanner.admin.database.v1.OptimizeRestoredDatabaseMetadata, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this OptimizeRestoredDatabaseMetadata to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };
                    }

                    /** RestoreSourceType enum. */
                    enum RestoreSourceType {
                        TYPE_UNSPECIFIED = 0,
                        BACKUP = 1
                    }
                }
            }

            /** Namespace instance. */
            namespace instance {

                /** Namespace v1. */
                namespace v1 {

                    /** Represents an InstanceAdmin */
                    class InstanceAdmin extends $protobuf.rpc.Service {

                        /**
                         * Constructs a new InstanceAdmin service.
                         * @param rpcImpl RPC implementation
                         * @param [requestDelimited=false] Whether requests are length-delimited
                         * @param [responseDelimited=false] Whether responses are length-delimited
                         */
                        constructor(rpcImpl: $protobuf.RPCImpl, requestDelimited?: boolean, responseDelimited?: boolean);

                        /**
                         * Creates new InstanceAdmin service using the specified rpc implementation.
                         * @param rpcImpl RPC implementation
                         * @param [requestDelimited=false] Whether requests are length-delimited
                         * @param [responseDelimited=false] Whether responses are length-delimited
                         * @returns RPC service. Useful where requests and/or responses are streamed.
                         */
                        public static create(rpcImpl: $protobuf.RPCImpl, requestDelimited?: boolean, responseDelimited?: boolean): InstanceAdmin;

                        /**
                         * Calls ListInstanceConfigs.
                         * @param request ListInstanceConfigsRequest message or plain object
                         * @param callback Node-style callback called with the error, if any, and ListInstanceConfigsResponse
                         */
                        public listInstanceConfigs(request: google.spanner.admin.instance.v1.IListInstanceConfigsRequest, callback: google.spanner.admin.instance.v1.InstanceAdmin.ListInstanceConfigsCallback): void;

                        /**
                         * Calls ListInstanceConfigs.
                         * @param request ListInstanceConfigsRequest message or plain object
                         * @returns Promise
                         */
                        public listInstanceConfigs(request: google.spanner.admin.instance.v1.IListInstanceConfigsRequest): Promise<google.spanner.admin.instance.v1.ListInstanceConfigsResponse>;

                        /**
                         * Calls GetInstanceConfig.
                         * @param request GetInstanceConfigRequest message or plain object
                         * @param callback Node-style callback called with the error, if any, and InstanceConfig
                         */
                        public getInstanceConfig(request: google.spanner.admin.instance.v1.IGetInstanceConfigRequest, callback: google.spanner.admin.instance.v1.InstanceAdmin.GetInstanceConfigCallback): void;

                        /**
                         * Calls GetInstanceConfig.
                         * @param request GetInstanceConfigRequest message or plain object
                         * @returns Promise
                         */
                        public getInstanceConfig(request: google.spanner.admin.instance.v1.IGetInstanceConfigRequest): Promise<google.spanner.admin.instance.v1.InstanceConfig>;

                        /**
                         * Calls ListInstances.
                         * @param request ListInstancesRequest message or plain object
                         * @param callback Node-style callback called with the error, if any, and ListInstancesResponse
                         */
                        public listInstances(request: google.spanner.admin.instance.v1.IListInstancesRequest, callback: google.spanner.admin.instance.v1.InstanceAdmin.ListInstancesCallback): void;

                        /**
                         * Calls ListInstances.
                         * @param request ListInstancesRequest message or plain object
                         * @returns Promise
                         */
                        public listInstances(request: google.spanner.admin.instance.v1.IListInstancesRequest): Promise<google.spanner.admin.instance.v1.ListInstancesResponse>;

                        /**
                         * Calls GetInstance.
                         * @param request GetInstanceRequest message or plain object
                         * @param callback Node-style callback called with the error, if any, and Instance
                         */
                        public getInstance(request: google.spanner.admin.instance.v1.IGetInstanceRequest, callback: google.spanner.admin.instance.v1.InstanceAdmin.GetInstanceCallback): void;

                        /**
                         * Calls GetInstance.
                         * @param request GetInstanceRequest message or plain object
                         * @returns Promise
                         */
                        public getInstance(request: google.spanner.admin.instance.v1.IGetInstanceRequest): Promise<google.spanner.admin.instance.v1.Instance>;

                        /**
                         * Calls CreateInstance.
                         * @param request CreateInstanceRequest message or plain object
                         * @param callback Node-style callback called with the error, if any, and Operation
                         */
                        public createInstance(request: google.spanner.admin.instance.v1.ICreateInstanceRequest, callback: google.spanner.admin.instance.v1.InstanceAdmin.CreateInstanceCallback): void;

                        /**
                         * Calls CreateInstance.
                         * @param request CreateInstanceRequest message or plain object
                         * @returns Promise
                         */
                        public createInstance(request: google.spanner.admin.instance.v1.ICreateInstanceRequest): Promise<google.longrunning.Operation>;

                        /**
                         * Calls UpdateInstance.
                         * @param request UpdateInstanceRequest message or plain object
                         * @param callback Node-style callback called with the error, if any, and Operation
                         */
                        public updateInstance(request: google.spanner.admin.instance.v1.IUpdateInstanceRequest, callback: google.spanner.admin.instance.v1.InstanceAdmin.UpdateInstanceCallback): void;

                        /**
                         * Calls UpdateInstance.
                         * @param request UpdateInstanceRequest message or plain object
                         * @returns Promise
                         */
                        public updateInstance(request: google.spanner.admin.instance.v1.IUpdateInstanceRequest): Promise<google.longrunning.Operation>;

                        /**
                         * Calls DeleteInstance.
                         * @param request DeleteInstanceRequest message or plain object
                         * @param callback Node-style callback called with the error, if any, and Empty
                         */
                        public deleteInstance(request: google.spanner.admin.instance.v1.IDeleteInstanceRequest, callback: google.spanner.admin.instance.v1.InstanceAdmin.DeleteInstanceCallback): void;

                        /**
                         * Calls DeleteInstance.
                         * @param request DeleteInstanceRequest message or plain object
                         * @returns Promise
                         */
                        public deleteInstance(request: google.spanner.admin.instance.v1.IDeleteInstanceRequest): Promise<google.protobuf.Empty>;

                        /**
                         * Calls SetIamPolicy.
                         * @param request SetIamPolicyRequest message or plain object
                         * @param callback Node-style callback called with the error, if any, and Policy
                         */
                        public setIamPolicy(request: google.iam.v1.ISetIamPolicyRequest, callback: google.spanner.admin.instance.v1.InstanceAdmin.SetIamPolicyCallback): void;

                        /**
                         * Calls SetIamPolicy.
                         * @param request SetIamPolicyRequest message or plain object
                         * @returns Promise
                         */
                        public setIamPolicy(request: google.iam.v1.ISetIamPolicyRequest): Promise<google.iam.v1.Policy>;

                        /**
                         * Calls GetIamPolicy.
                         * @param request GetIamPolicyRequest message or plain object
                         * @param callback Node-style callback called with the error, if any, and Policy
                         */
                        public getIamPolicy(request: google.iam.v1.IGetIamPolicyRequest, callback: google.spanner.admin.instance.v1.InstanceAdmin.GetIamPolicyCallback): void;

                        /**
                         * Calls GetIamPolicy.
                         * @param request GetIamPolicyRequest message or plain object
                         * @returns Promise
                         */
                        public getIamPolicy(request: google.iam.v1.IGetIamPolicyRequest): Promise<google.iam.v1.Policy>;

                        /**
                         * Calls TestIamPermissions.
                         * @param request TestIamPermissionsRequest message or plain object
                         * @param callback Node-style callback called with the error, if any, and TestIamPermissionsResponse
                         */
                        public testIamPermissions(request: google.iam.v1.ITestIamPermissionsRequest, callback: google.spanner.admin.instance.v1.InstanceAdmin.TestIamPermissionsCallback): void;

                        /**
                         * Calls TestIamPermissions.
                         * @param request TestIamPermissionsRequest message or plain object
                         * @returns Promise
                         */
                        public testIamPermissions(request: google.iam.v1.ITestIamPermissionsRequest): Promise<google.iam.v1.TestIamPermissionsResponse>;
                    }

                    namespace InstanceAdmin {

                        /**
                         * Callback as used by {@link google.spanner.admin.instance.v1.InstanceAdmin#listInstanceConfigs}.
                         * @param error Error, if any
                         * @param [response] ListInstanceConfigsResponse
                         */
                        type ListInstanceConfigsCallback = (error: (Error|null), response?: google.spanner.admin.instance.v1.ListInstanceConfigsResponse) => void;

                        /**
                         * Callback as used by {@link google.spanner.admin.instance.v1.InstanceAdmin#getInstanceConfig}.
                         * @param error Error, if any
                         * @param [response] InstanceConfig
                         */
                        type GetInstanceConfigCallback = (error: (Error|null), response?: google.spanner.admin.instance.v1.InstanceConfig) => void;

                        /**
                         * Callback as used by {@link google.spanner.admin.instance.v1.InstanceAdmin#listInstances}.
                         * @param error Error, if any
                         * @param [response] ListInstancesResponse
                         */
                        type ListInstancesCallback = (error: (Error|null), response?: google.spanner.admin.instance.v1.ListInstancesResponse) => void;

                        /**
                         * Callback as used by {@link google.spanner.admin.instance.v1.InstanceAdmin#getInstance}.
                         * @param error Error, if any
                         * @param [response] Instance
                         */
                        type GetInstanceCallback = (error: (Error|null), response?: google.spanner.admin.instance.v1.Instance) => void;

                        /**
                         * Callback as used by {@link google.spanner.admin.instance.v1.InstanceAdmin#createInstance}.
                         * @param error Error, if any
                         * @param [response] Operation
                         */
                        type CreateInstanceCallback = (error: (Error|null), response?: google.longrunning.Operation) => void;

                        /**
                         * Callback as used by {@link google.spanner.admin.instance.v1.InstanceAdmin#updateInstance}.
                         * @param error Error, if any
                         * @param [response] Operation
                         */
                        type UpdateInstanceCallback = (error: (Error|null), response?: google.longrunning.Operation) => void;

                        /**
                         * Callback as used by {@link google.spanner.admin.instance.v1.InstanceAdmin#deleteInstance}.
                         * @param error Error, if any
                         * @param [response] Empty
                         */
                        type DeleteInstanceCallback = (error: (Error|null), response?: google.protobuf.Empty) => void;

                        /**
                         * Callback as used by {@link google.spanner.admin.instance.v1.InstanceAdmin#setIamPolicy}.
                         * @param error Error, if any
                         * @param [response] Policy
                         */
                        type SetIamPolicyCallback = (error: (Error|null), response?: google.iam.v1.Policy) => void;

                        /**
                         * Callback as used by {@link google.spanner.admin.instance.v1.InstanceAdmin#getIamPolicy}.
                         * @param error Error, if any
                         * @param [response] Policy
                         */
                        type GetIamPolicyCallback = (error: (Error|null), response?: google.iam.v1.Policy) => void;

                        /**
                         * Callback as used by {@link google.spanner.admin.instance.v1.InstanceAdmin#testIamPermissions}.
                         * @param error Error, if any
                         * @param [response] TestIamPermissionsResponse
                         */
                        type TestIamPermissionsCallback = (error: (Error|null), response?: google.iam.v1.TestIamPermissionsResponse) => void;
                    }

                    /** Properties of a ReplicaInfo. */
                    interface IReplicaInfo {

                        /** ReplicaInfo location */
                        location?: (string|null);

                        /** ReplicaInfo type */
                        type?: (google.spanner.admin.instance.v1.ReplicaInfo.ReplicaType|keyof typeof google.spanner.admin.instance.v1.ReplicaInfo.ReplicaType|null);

                        /** ReplicaInfo defaultLeaderLocation */
                        defaultLeaderLocation?: (boolean|null);
                    }

                    /** Represents a ReplicaInfo. */
                    class ReplicaInfo implements IReplicaInfo {

                        /**
                         * Constructs a new ReplicaInfo.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: google.spanner.admin.instance.v1.IReplicaInfo);

                        /** ReplicaInfo location. */
                        public location: string;

                        /** ReplicaInfo type. */
                        public type: (google.spanner.admin.instance.v1.ReplicaInfo.ReplicaType|keyof typeof google.spanner.admin.instance.v1.ReplicaInfo.ReplicaType);

                        /** ReplicaInfo defaultLeaderLocation. */
                        public defaultLeaderLocation: boolean;

                        /**
                         * Creates a new ReplicaInfo instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns ReplicaInfo instance
                         */
                        public static create(properties?: google.spanner.admin.instance.v1.IReplicaInfo): google.spanner.admin.instance.v1.ReplicaInfo;

                        /**
                         * Encodes the specified ReplicaInfo message. Does not implicitly {@link google.spanner.admin.instance.v1.ReplicaInfo.verify|verify} messages.
                         * @param message ReplicaInfo message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: google.spanner.admin.instance.v1.IReplicaInfo, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified ReplicaInfo message, length delimited. Does not implicitly {@link google.spanner.admin.instance.v1.ReplicaInfo.verify|verify} messages.
                         * @param message ReplicaInfo message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: google.spanner.admin.instance.v1.IReplicaInfo, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes a ReplicaInfo message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns ReplicaInfo
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.instance.v1.ReplicaInfo;

                        /**
                         * Decodes a ReplicaInfo message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns ReplicaInfo
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.instance.v1.ReplicaInfo;

                        /**
                         * Verifies a ReplicaInfo message.
                         * @param message Plain object to verify
                         * @returns `null` if valid, otherwise the reason why it is not
                         */
                        public static verify(message: { [k: string]: any }): (string|null);

                        /**
                         * Creates a ReplicaInfo message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns ReplicaInfo
                         */
                        public static fromObject(object: { [k: string]: any }): google.spanner.admin.instance.v1.ReplicaInfo;

                        /**
                         * Creates a plain object from a ReplicaInfo message. Also converts values to other types if specified.
                         * @param message ReplicaInfo
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: google.spanner.admin.instance.v1.ReplicaInfo, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this ReplicaInfo to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };
                    }

                    namespace ReplicaInfo {

                        /** ReplicaType enum. */
                        enum ReplicaType {
                            TYPE_UNSPECIFIED = 0,
                            READ_WRITE = 1,
                            READ_ONLY = 2,
                            WITNESS = 3
                        }
                    }

                    /** Properties of an InstanceConfig. */
                    interface IInstanceConfig {

                        /** InstanceConfig name */
                        name?: (string|null);

                        /** InstanceConfig displayName */
                        displayName?: (string|null);

                        /** InstanceConfig replicas */
                        replicas?: (google.spanner.admin.instance.v1.IReplicaInfo[]|null);

                        /** InstanceConfig leaderOptions */
                        leaderOptions?: (string[]|null);
                    }

                    /** Represents an InstanceConfig. */
                    class InstanceConfig implements IInstanceConfig {

                        /**
                         * Constructs a new InstanceConfig.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: google.spanner.admin.instance.v1.IInstanceConfig);

                        /** InstanceConfig name. */
                        public name: string;

                        /** InstanceConfig displayName. */
                        public displayName: string;

                        /** InstanceConfig replicas. */
                        public replicas: google.spanner.admin.instance.v1.IReplicaInfo[];

                        /** InstanceConfig leaderOptions. */
                        public leaderOptions: string[];

                        /**
                         * Creates a new InstanceConfig instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns InstanceConfig instance
                         */
                        public static create(properties?: google.spanner.admin.instance.v1.IInstanceConfig): google.spanner.admin.instance.v1.InstanceConfig;

                        /**
                         * Encodes the specified InstanceConfig message. Does not implicitly {@link google.spanner.admin.instance.v1.InstanceConfig.verify|verify} messages.
                         * @param message InstanceConfig message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: google.spanner.admin.instance.v1.IInstanceConfig, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified InstanceConfig message, length delimited. Does not implicitly {@link google.spanner.admin.instance.v1.InstanceConfig.verify|verify} messages.
                         * @param message InstanceConfig message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: google.spanner.admin.instance.v1.IInstanceConfig, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes an InstanceConfig message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns InstanceConfig
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.instance.v1.InstanceConfig;

                        /**
                         * Decodes an InstanceConfig message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns InstanceConfig
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.instance.v1.InstanceConfig;

                        /**
                         * Verifies an InstanceConfig message.
                         * @param message Plain object to verify
                         * @returns `null` if valid, otherwise the reason why it is not
                         */
                        public static verify(message: { [k: string]: any }): (string|null);

                        /**
                         * Creates an InstanceConfig message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns InstanceConfig
                         */
                        public static fromObject(object: { [k: string]: any }): google.spanner.admin.instance.v1.InstanceConfig;

                        /**
                         * Creates a plain object from an InstanceConfig message. Also converts values to other types if specified.
                         * @param message InstanceConfig
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: google.spanner.admin.instance.v1.InstanceConfig, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this InstanceConfig to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };
                    }

                    /** Properties of an Instance. */
                    interface IInstance {

                        /** Instance name */
                        name?: (string|null);

                        /** Instance config */
                        config?: (string|null);

                        /** Instance displayName */
                        displayName?: (string|null);

                        /** Instance nodeCount */
                        nodeCount?: (number|null);

                        /** Instance processingUnits */
                        processingUnits?: (number|null);

                        /** Instance state */
                        state?: (google.spanner.admin.instance.v1.Instance.State|keyof typeof google.spanner.admin.instance.v1.Instance.State|null);

                        /** Instance labels */
                        labels?: ({ [k: string]: string }|null);

                        /** Instance endpointUris */
                        endpointUris?: (string[]|null);
                    }

                    /** Represents an Instance. */
                    class Instance implements IInstance {

                        /**
                         * Constructs a new Instance.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: google.spanner.admin.instance.v1.IInstance);

                        /** Instance name. */
                        public name: string;

                        /** Instance config. */
                        public config: string;

                        /** Instance displayName. */
                        public displayName: string;

                        /** Instance nodeCount. */
                        public nodeCount: number;

                        /** Instance processingUnits. */
                        public processingUnits: number;

                        /** Instance state. */
                        public state: (google.spanner.admin.instance.v1.Instance.State|keyof typeof google.spanner.admin.instance.v1.Instance.State);

                        /** Instance labels. */
                        public labels: { [k: string]: string };

                        /** Instance endpointUris. */
                        public endpointUris: string[];

                        /**
                         * Creates a new Instance instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns Instance instance
                         */
                        public static create(properties?: google.spanner.admin.instance.v1.IInstance): google.spanner.admin.instance.v1.Instance;

                        /**
                         * Encodes the specified Instance message. Does not implicitly {@link google.spanner.admin.instance.v1.Instance.verify|verify} messages.
                         * @param message Instance message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: google.spanner.admin.instance.v1.IInstance, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified Instance message, length delimited. Does not implicitly {@link google.spanner.admin.instance.v1.Instance.verify|verify} messages.
                         * @param message Instance message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: google.spanner.admin.instance.v1.IInstance, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes an Instance message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns Instance
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.instance.v1.Instance;

                        /**
                         * Decodes an Instance message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns Instance
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.instance.v1.Instance;

                        /**
                         * Verifies an Instance message.
                         * @param message Plain object to verify
                         * @returns `null` if valid, otherwise the reason why it is not
                         */
                        public static verify(message: { [k: string]: any }): (string|null);

                        /**
                         * Creates an Instance message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns Instance
                         */
                        public static fromObject(object: { [k: string]: any }): google.spanner.admin.instance.v1.Instance;

                        /**
                         * Creates a plain object from an Instance message. Also converts values to other types if specified.
                         * @param message Instance
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: google.spanner.admin.instance.v1.Instance, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this Instance to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };
                    }

                    namespace Instance {

                        /** State enum. */
                        enum State {
                            STATE_UNSPECIFIED = 0,
                            CREATING = 1,
                            READY = 2
                        }
                    }

                    /** Properties of a ListInstanceConfigsRequest. */
                    interface IListInstanceConfigsRequest {

                        /** ListInstanceConfigsRequest parent */
                        parent?: (string|null);

                        /** ListInstanceConfigsRequest pageSize */
                        pageSize?: (number|null);

                        /** ListInstanceConfigsRequest pageToken */
                        pageToken?: (string|null);
                    }

                    /** Represents a ListInstanceConfigsRequest. */
                    class ListInstanceConfigsRequest implements IListInstanceConfigsRequest {

                        /**
                         * Constructs a new ListInstanceConfigsRequest.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: google.spanner.admin.instance.v1.IListInstanceConfigsRequest);

                        /** ListInstanceConfigsRequest parent. */
                        public parent: string;

                        /** ListInstanceConfigsRequest pageSize. */
                        public pageSize: number;

                        /** ListInstanceConfigsRequest pageToken. */
                        public pageToken: string;

                        /**
                         * Creates a new ListInstanceConfigsRequest instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns ListInstanceConfigsRequest instance
                         */
                        public static create(properties?: google.spanner.admin.instance.v1.IListInstanceConfigsRequest): google.spanner.admin.instance.v1.ListInstanceConfigsRequest;

                        /**
                         * Encodes the specified ListInstanceConfigsRequest message. Does not implicitly {@link google.spanner.admin.instance.v1.ListInstanceConfigsRequest.verify|verify} messages.
                         * @param message ListInstanceConfigsRequest message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: google.spanner.admin.instance.v1.IListInstanceConfigsRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified ListInstanceConfigsRequest message, length delimited. Does not implicitly {@link google.spanner.admin.instance.v1.ListInstanceConfigsRequest.verify|verify} messages.
                         * @param message ListInstanceConfigsRequest message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: google.spanner.admin.instance.v1.IListInstanceConfigsRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes a ListInstanceConfigsRequest message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns ListInstanceConfigsRequest
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.instance.v1.ListInstanceConfigsRequest;

                        /**
                         * Decodes a ListInstanceConfigsRequest message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns ListInstanceConfigsRequest
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.instance.v1.ListInstanceConfigsRequest;

                        /**
                         * Verifies a ListInstanceConfigsRequest message.
                         * @param message Plain object to verify
                         * @returns `null` if valid, otherwise the reason why it is not
                         */
                        public static verify(message: { [k: string]: any }): (string|null);

                        /**
                         * Creates a ListInstanceConfigsRequest message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns ListInstanceConfigsRequest
                         */
                        public static fromObject(object: { [k: string]: any }): google.spanner.admin.instance.v1.ListInstanceConfigsRequest;

                        /**
                         * Creates a plain object from a ListInstanceConfigsRequest message. Also converts values to other types if specified.
                         * @param message ListInstanceConfigsRequest
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: google.spanner.admin.instance.v1.ListInstanceConfigsRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this ListInstanceConfigsRequest to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };
                    }

                    /** Properties of a ListInstanceConfigsResponse. */
                    interface IListInstanceConfigsResponse {

                        /** ListInstanceConfigsResponse instanceConfigs */
                        instanceConfigs?: (google.spanner.admin.instance.v1.IInstanceConfig[]|null);

                        /** ListInstanceConfigsResponse nextPageToken */
                        nextPageToken?: (string|null);
                    }

                    /** Represents a ListInstanceConfigsResponse. */
                    class ListInstanceConfigsResponse implements IListInstanceConfigsResponse {

                        /**
                         * Constructs a new ListInstanceConfigsResponse.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: google.spanner.admin.instance.v1.IListInstanceConfigsResponse);

                        /** ListInstanceConfigsResponse instanceConfigs. */
                        public instanceConfigs: google.spanner.admin.instance.v1.IInstanceConfig[];

                        /** ListInstanceConfigsResponse nextPageToken. */
                        public nextPageToken: string;

                        /**
                         * Creates a new ListInstanceConfigsResponse instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns ListInstanceConfigsResponse instance
                         */
                        public static create(properties?: google.spanner.admin.instance.v1.IListInstanceConfigsResponse): google.spanner.admin.instance.v1.ListInstanceConfigsResponse;

                        /**
                         * Encodes the specified ListInstanceConfigsResponse message. Does not implicitly {@link google.spanner.admin.instance.v1.ListInstanceConfigsResponse.verify|verify} messages.
                         * @param message ListInstanceConfigsResponse message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: google.spanner.admin.instance.v1.IListInstanceConfigsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified ListInstanceConfigsResponse message, length delimited. Does not implicitly {@link google.spanner.admin.instance.v1.ListInstanceConfigsResponse.verify|verify} messages.
                         * @param message ListInstanceConfigsResponse message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: google.spanner.admin.instance.v1.IListInstanceConfigsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes a ListInstanceConfigsResponse message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns ListInstanceConfigsResponse
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.instance.v1.ListInstanceConfigsResponse;

                        /**
                         * Decodes a ListInstanceConfigsResponse message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns ListInstanceConfigsResponse
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.instance.v1.ListInstanceConfigsResponse;

                        /**
                         * Verifies a ListInstanceConfigsResponse message.
                         * @param message Plain object to verify
                         * @returns `null` if valid, otherwise the reason why it is not
                         */
                        public static verify(message: { [k: string]: any }): (string|null);

                        /**
                         * Creates a ListInstanceConfigsResponse message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns ListInstanceConfigsResponse
                         */
                        public static fromObject(object: { [k: string]: any }): google.spanner.admin.instance.v1.ListInstanceConfigsResponse;

                        /**
                         * Creates a plain object from a ListInstanceConfigsResponse message. Also converts values to other types if specified.
                         * @param message ListInstanceConfigsResponse
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: google.spanner.admin.instance.v1.ListInstanceConfigsResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this ListInstanceConfigsResponse to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };
                    }

                    /** Properties of a GetInstanceConfigRequest. */
                    interface IGetInstanceConfigRequest {

                        /** GetInstanceConfigRequest name */
                        name?: (string|null);
                    }

                    /** Represents a GetInstanceConfigRequest. */
                    class GetInstanceConfigRequest implements IGetInstanceConfigRequest {

                        /**
                         * Constructs a new GetInstanceConfigRequest.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: google.spanner.admin.instance.v1.IGetInstanceConfigRequest);

                        /** GetInstanceConfigRequest name. */
                        public name: string;

                        /**
                         * Creates a new GetInstanceConfigRequest instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns GetInstanceConfigRequest instance
                         */
                        public static create(properties?: google.spanner.admin.instance.v1.IGetInstanceConfigRequest): google.spanner.admin.instance.v1.GetInstanceConfigRequest;

                        /**
                         * Encodes the specified GetInstanceConfigRequest message. Does not implicitly {@link google.spanner.admin.instance.v1.GetInstanceConfigRequest.verify|verify} messages.
                         * @param message GetInstanceConfigRequest message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: google.spanner.admin.instance.v1.IGetInstanceConfigRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified GetInstanceConfigRequest message, length delimited. Does not implicitly {@link google.spanner.admin.instance.v1.GetInstanceConfigRequest.verify|verify} messages.
                         * @param message GetInstanceConfigRequest message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: google.spanner.admin.instance.v1.IGetInstanceConfigRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes a GetInstanceConfigRequest message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns GetInstanceConfigRequest
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.instance.v1.GetInstanceConfigRequest;

                        /**
                         * Decodes a GetInstanceConfigRequest message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns GetInstanceConfigRequest
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.instance.v1.GetInstanceConfigRequest;

                        /**
                         * Verifies a GetInstanceConfigRequest message.
                         * @param message Plain object to verify
                         * @returns `null` if valid, otherwise the reason why it is not
                         */
                        public static verify(message: { [k: string]: any }): (string|null);

                        /**
                         * Creates a GetInstanceConfigRequest message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns GetInstanceConfigRequest
                         */
                        public static fromObject(object: { [k: string]: any }): google.spanner.admin.instance.v1.GetInstanceConfigRequest;

                        /**
                         * Creates a plain object from a GetInstanceConfigRequest message. Also converts values to other types if specified.
                         * @param message GetInstanceConfigRequest
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: google.spanner.admin.instance.v1.GetInstanceConfigRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this GetInstanceConfigRequest to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };
                    }

                    /** Properties of a GetInstanceRequest. */
                    interface IGetInstanceRequest {

                        /** GetInstanceRequest name */
                        name?: (string|null);

                        /** GetInstanceRequest fieldMask */
                        fieldMask?: (google.protobuf.IFieldMask|null);
                    }

                    /** Represents a GetInstanceRequest. */
                    class GetInstanceRequest implements IGetInstanceRequest {

                        /**
                         * Constructs a new GetInstanceRequest.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: google.spanner.admin.instance.v1.IGetInstanceRequest);

                        /** GetInstanceRequest name. */
                        public name: string;

                        /** GetInstanceRequest fieldMask. */
                        public fieldMask?: (google.protobuf.IFieldMask|null);

                        /**
                         * Creates a new GetInstanceRequest instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns GetInstanceRequest instance
                         */
                        public static create(properties?: google.spanner.admin.instance.v1.IGetInstanceRequest): google.spanner.admin.instance.v1.GetInstanceRequest;

                        /**
                         * Encodes the specified GetInstanceRequest message. Does not implicitly {@link google.spanner.admin.instance.v1.GetInstanceRequest.verify|verify} messages.
                         * @param message GetInstanceRequest message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: google.spanner.admin.instance.v1.IGetInstanceRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified GetInstanceRequest message, length delimited. Does not implicitly {@link google.spanner.admin.instance.v1.GetInstanceRequest.verify|verify} messages.
                         * @param message GetInstanceRequest message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: google.spanner.admin.instance.v1.IGetInstanceRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes a GetInstanceRequest message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns GetInstanceRequest
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.instance.v1.GetInstanceRequest;

                        /**
                         * Decodes a GetInstanceRequest message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns GetInstanceRequest
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.instance.v1.GetInstanceRequest;

                        /**
                         * Verifies a GetInstanceRequest message.
                         * @param message Plain object to verify
                         * @returns `null` if valid, otherwise the reason why it is not
                         */
                        public static verify(message: { [k: string]: any }): (string|null);

                        /**
                         * Creates a GetInstanceRequest message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns GetInstanceRequest
                         */
                        public static fromObject(object: { [k: string]: any }): google.spanner.admin.instance.v1.GetInstanceRequest;

                        /**
                         * Creates a plain object from a GetInstanceRequest message. Also converts values to other types if specified.
                         * @param message GetInstanceRequest
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: google.spanner.admin.instance.v1.GetInstanceRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this GetInstanceRequest to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };
                    }

                    /** Properties of a CreateInstanceRequest. */
                    interface ICreateInstanceRequest {

                        /** CreateInstanceRequest parent */
                        parent?: (string|null);

                        /** CreateInstanceRequest instanceId */
                        instanceId?: (string|null);

                        /** CreateInstanceRequest instance */
                        instance?: (google.spanner.admin.instance.v1.IInstance|null);
                    }

                    /** Represents a CreateInstanceRequest. */
                    class CreateInstanceRequest implements ICreateInstanceRequest {

                        /**
                         * Constructs a new CreateInstanceRequest.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: google.spanner.admin.instance.v1.ICreateInstanceRequest);

                        /** CreateInstanceRequest parent. */
                        public parent: string;

                        /** CreateInstanceRequest instanceId. */
                        public instanceId: string;

                        /** CreateInstanceRequest instance. */
                        public instance?: (google.spanner.admin.instance.v1.IInstance|null);

                        /**
                         * Creates a new CreateInstanceRequest instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns CreateInstanceRequest instance
                         */
                        public static create(properties?: google.spanner.admin.instance.v1.ICreateInstanceRequest): google.spanner.admin.instance.v1.CreateInstanceRequest;

                        /**
                         * Encodes the specified CreateInstanceRequest message. Does not implicitly {@link google.spanner.admin.instance.v1.CreateInstanceRequest.verify|verify} messages.
                         * @param message CreateInstanceRequest message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: google.spanner.admin.instance.v1.ICreateInstanceRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified CreateInstanceRequest message, length delimited. Does not implicitly {@link google.spanner.admin.instance.v1.CreateInstanceRequest.verify|verify} messages.
                         * @param message CreateInstanceRequest message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: google.spanner.admin.instance.v1.ICreateInstanceRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes a CreateInstanceRequest message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns CreateInstanceRequest
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.instance.v1.CreateInstanceRequest;

                        /**
                         * Decodes a CreateInstanceRequest message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns CreateInstanceRequest
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.instance.v1.CreateInstanceRequest;

                        /**
                         * Verifies a CreateInstanceRequest message.
                         * @param message Plain object to verify
                         * @returns `null` if valid, otherwise the reason why it is not
                         */
                        public static verify(message: { [k: string]: any }): (string|null);

                        /**
                         * Creates a CreateInstanceRequest message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns CreateInstanceRequest
                         */
                        public static fromObject(object: { [k: string]: any }): google.spanner.admin.instance.v1.CreateInstanceRequest;

                        /**
                         * Creates a plain object from a CreateInstanceRequest message. Also converts values to other types if specified.
                         * @param message CreateInstanceRequest
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: google.spanner.admin.instance.v1.CreateInstanceRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this CreateInstanceRequest to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };
                    }

                    /** Properties of a ListInstancesRequest. */
                    interface IListInstancesRequest {

                        /** ListInstancesRequest parent */
                        parent?: (string|null);

                        /** ListInstancesRequest pageSize */
                        pageSize?: (number|null);

                        /** ListInstancesRequest pageToken */
                        pageToken?: (string|null);

                        /** ListInstancesRequest filter */
                        filter?: (string|null);
                    }

                    /** Represents a ListInstancesRequest. */
                    class ListInstancesRequest implements IListInstancesRequest {

                        /**
                         * Constructs a new ListInstancesRequest.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: google.spanner.admin.instance.v1.IListInstancesRequest);

                        /** ListInstancesRequest parent. */
                        public parent: string;

                        /** ListInstancesRequest pageSize. */
                        public pageSize: number;

                        /** ListInstancesRequest pageToken. */
                        public pageToken: string;

                        /** ListInstancesRequest filter. */
                        public filter: string;

                        /**
                         * Creates a new ListInstancesRequest instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns ListInstancesRequest instance
                         */
                        public static create(properties?: google.spanner.admin.instance.v1.IListInstancesRequest): google.spanner.admin.instance.v1.ListInstancesRequest;

                        /**
                         * Encodes the specified ListInstancesRequest message. Does not implicitly {@link google.spanner.admin.instance.v1.ListInstancesRequest.verify|verify} messages.
                         * @param message ListInstancesRequest message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: google.spanner.admin.instance.v1.IListInstancesRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified ListInstancesRequest message, length delimited. Does not implicitly {@link google.spanner.admin.instance.v1.ListInstancesRequest.verify|verify} messages.
                         * @param message ListInstancesRequest message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: google.spanner.admin.instance.v1.IListInstancesRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes a ListInstancesRequest message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns ListInstancesRequest
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.instance.v1.ListInstancesRequest;

                        /**
                         * Decodes a ListInstancesRequest message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns ListInstancesRequest
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.instance.v1.ListInstancesRequest;

                        /**
                         * Verifies a ListInstancesRequest message.
                         * @param message Plain object to verify
                         * @returns `null` if valid, otherwise the reason why it is not
                         */
                        public static verify(message: { [k: string]: any }): (string|null);

                        /**
                         * Creates a ListInstancesRequest message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns ListInstancesRequest
                         */
                        public static fromObject(object: { [k: string]: any }): google.spanner.admin.instance.v1.ListInstancesRequest;

                        /**
                         * Creates a plain object from a ListInstancesRequest message. Also converts values to other types if specified.
                         * @param message ListInstancesRequest
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: google.spanner.admin.instance.v1.ListInstancesRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this ListInstancesRequest to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };
                    }

                    /** Properties of a ListInstancesResponse. */
                    interface IListInstancesResponse {

                        /** ListInstancesResponse instances */
                        instances?: (google.spanner.admin.instance.v1.IInstance[]|null);

                        /** ListInstancesResponse nextPageToken */
                        nextPageToken?: (string|null);
                    }

                    /** Represents a ListInstancesResponse. */
                    class ListInstancesResponse implements IListInstancesResponse {

                        /**
                         * Constructs a new ListInstancesResponse.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: google.spanner.admin.instance.v1.IListInstancesResponse);

                        /** ListInstancesResponse instances. */
                        public instances: google.spanner.admin.instance.v1.IInstance[];

                        /** ListInstancesResponse nextPageToken. */
                        public nextPageToken: string;

                        /**
                         * Creates a new ListInstancesResponse instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns ListInstancesResponse instance
                         */
                        public static create(properties?: google.spanner.admin.instance.v1.IListInstancesResponse): google.spanner.admin.instance.v1.ListInstancesResponse;

                        /**
                         * Encodes the specified ListInstancesResponse message. Does not implicitly {@link google.spanner.admin.instance.v1.ListInstancesResponse.verify|verify} messages.
                         * @param message ListInstancesResponse message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: google.spanner.admin.instance.v1.IListInstancesResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified ListInstancesResponse message, length delimited. Does not implicitly {@link google.spanner.admin.instance.v1.ListInstancesResponse.verify|verify} messages.
                         * @param message ListInstancesResponse message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: google.spanner.admin.instance.v1.IListInstancesResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes a ListInstancesResponse message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns ListInstancesResponse
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.instance.v1.ListInstancesResponse;

                        /**
                         * Decodes a ListInstancesResponse message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns ListInstancesResponse
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.instance.v1.ListInstancesResponse;

                        /**
                         * Verifies a ListInstancesResponse message.
                         * @param message Plain object to verify
                         * @returns `null` if valid, otherwise the reason why it is not
                         */
                        public static verify(message: { [k: string]: any }): (string|null);

                        /**
                         * Creates a ListInstancesResponse message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns ListInstancesResponse
                         */
                        public static fromObject(object: { [k: string]: any }): google.spanner.admin.instance.v1.ListInstancesResponse;

                        /**
                         * Creates a plain object from a ListInstancesResponse message. Also converts values to other types if specified.
                         * @param message ListInstancesResponse
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: google.spanner.admin.instance.v1.ListInstancesResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this ListInstancesResponse to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };
                    }

                    /** Properties of an UpdateInstanceRequest. */
                    interface IUpdateInstanceRequest {

                        /** UpdateInstanceRequest instance */
                        instance?: (google.spanner.admin.instance.v1.IInstance|null);

                        /** UpdateInstanceRequest fieldMask */
                        fieldMask?: (google.protobuf.IFieldMask|null);
                    }

                    /** Represents an UpdateInstanceRequest. */
                    class UpdateInstanceRequest implements IUpdateInstanceRequest {

                        /**
                         * Constructs a new UpdateInstanceRequest.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: google.spanner.admin.instance.v1.IUpdateInstanceRequest);

                        /** UpdateInstanceRequest instance. */
                        public instance?: (google.spanner.admin.instance.v1.IInstance|null);

                        /** UpdateInstanceRequest fieldMask. */
                        public fieldMask?: (google.protobuf.IFieldMask|null);

                        /**
                         * Creates a new UpdateInstanceRequest instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns UpdateInstanceRequest instance
                         */
                        public static create(properties?: google.spanner.admin.instance.v1.IUpdateInstanceRequest): google.spanner.admin.instance.v1.UpdateInstanceRequest;

                        /**
                         * Encodes the specified UpdateInstanceRequest message. Does not implicitly {@link google.spanner.admin.instance.v1.UpdateInstanceRequest.verify|verify} messages.
                         * @param message UpdateInstanceRequest message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: google.spanner.admin.instance.v1.IUpdateInstanceRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified UpdateInstanceRequest message, length delimited. Does not implicitly {@link google.spanner.admin.instance.v1.UpdateInstanceRequest.verify|verify} messages.
                         * @param message UpdateInstanceRequest message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: google.spanner.admin.instance.v1.IUpdateInstanceRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes an UpdateInstanceRequest message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns UpdateInstanceRequest
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.instance.v1.UpdateInstanceRequest;

                        /**
                         * Decodes an UpdateInstanceRequest message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns UpdateInstanceRequest
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.instance.v1.UpdateInstanceRequest;

                        /**
                         * Verifies an UpdateInstanceRequest message.
                         * @param message Plain object to verify
                         * @returns `null` if valid, otherwise the reason why it is not
                         */
                        public static verify(message: { [k: string]: any }): (string|null);

                        /**
                         * Creates an UpdateInstanceRequest message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns UpdateInstanceRequest
                         */
                        public static fromObject(object: { [k: string]: any }): google.spanner.admin.instance.v1.UpdateInstanceRequest;

                        /**
                         * Creates a plain object from an UpdateInstanceRequest message. Also converts values to other types if specified.
                         * @param message UpdateInstanceRequest
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: google.spanner.admin.instance.v1.UpdateInstanceRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this UpdateInstanceRequest to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };
                    }

                    /** Properties of a DeleteInstanceRequest. */
                    interface IDeleteInstanceRequest {

                        /** DeleteInstanceRequest name */
                        name?: (string|null);
                    }

                    /** Represents a DeleteInstanceRequest. */
                    class DeleteInstanceRequest implements IDeleteInstanceRequest {

                        /**
                         * Constructs a new DeleteInstanceRequest.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: google.spanner.admin.instance.v1.IDeleteInstanceRequest);

                        /** DeleteInstanceRequest name. */
                        public name: string;

                        /**
                         * Creates a new DeleteInstanceRequest instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns DeleteInstanceRequest instance
                         */
                        public static create(properties?: google.spanner.admin.instance.v1.IDeleteInstanceRequest): google.spanner.admin.instance.v1.DeleteInstanceRequest;

                        /**
                         * Encodes the specified DeleteInstanceRequest message. Does not implicitly {@link google.spanner.admin.instance.v1.DeleteInstanceRequest.verify|verify} messages.
                         * @param message DeleteInstanceRequest message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: google.spanner.admin.instance.v1.IDeleteInstanceRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified DeleteInstanceRequest message, length delimited. Does not implicitly {@link google.spanner.admin.instance.v1.DeleteInstanceRequest.verify|verify} messages.
                         * @param message DeleteInstanceRequest message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: google.spanner.admin.instance.v1.IDeleteInstanceRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes a DeleteInstanceRequest message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns DeleteInstanceRequest
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.instance.v1.DeleteInstanceRequest;

                        /**
                         * Decodes a DeleteInstanceRequest message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns DeleteInstanceRequest
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.instance.v1.DeleteInstanceRequest;

                        /**
                         * Verifies a DeleteInstanceRequest message.
                         * @param message Plain object to verify
                         * @returns `null` if valid, otherwise the reason why it is not
                         */
                        public static verify(message: { [k: string]: any }): (string|null);

                        /**
                         * Creates a DeleteInstanceRequest message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns DeleteInstanceRequest
                         */
                        public static fromObject(object: { [k: string]: any }): google.spanner.admin.instance.v1.DeleteInstanceRequest;

                        /**
                         * Creates a plain object from a DeleteInstanceRequest message. Also converts values to other types if specified.
                         * @param message DeleteInstanceRequest
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: google.spanner.admin.instance.v1.DeleteInstanceRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this DeleteInstanceRequest to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };
                    }

                    /** Properties of a CreateInstanceMetadata. */
                    interface ICreateInstanceMetadata {

                        /** CreateInstanceMetadata instance */
                        instance?: (google.spanner.admin.instance.v1.IInstance|null);

                        /** CreateInstanceMetadata startTime */
                        startTime?: (google.protobuf.ITimestamp|null);

                        /** CreateInstanceMetadata cancelTime */
                        cancelTime?: (google.protobuf.ITimestamp|null);

                        /** CreateInstanceMetadata endTime */
                        endTime?: (google.protobuf.ITimestamp|null);
                    }

                    /** Represents a CreateInstanceMetadata. */
                    class CreateInstanceMetadata implements ICreateInstanceMetadata {

                        /**
                         * Constructs a new CreateInstanceMetadata.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: google.spanner.admin.instance.v1.ICreateInstanceMetadata);

                        /** CreateInstanceMetadata instance. */
                        public instance?: (google.spanner.admin.instance.v1.IInstance|null);

                        /** CreateInstanceMetadata startTime. */
                        public startTime?: (google.protobuf.ITimestamp|null);

                        /** CreateInstanceMetadata cancelTime. */
                        public cancelTime?: (google.protobuf.ITimestamp|null);

                        /** CreateInstanceMetadata endTime. */
                        public endTime?: (google.protobuf.ITimestamp|null);

                        /**
                         * Creates a new CreateInstanceMetadata instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns CreateInstanceMetadata instance
                         */
                        public static create(properties?: google.spanner.admin.instance.v1.ICreateInstanceMetadata): google.spanner.admin.instance.v1.CreateInstanceMetadata;

                        /**
                         * Encodes the specified CreateInstanceMetadata message. Does not implicitly {@link google.spanner.admin.instance.v1.CreateInstanceMetadata.verify|verify} messages.
                         * @param message CreateInstanceMetadata message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: google.spanner.admin.instance.v1.ICreateInstanceMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified CreateInstanceMetadata message, length delimited. Does not implicitly {@link google.spanner.admin.instance.v1.CreateInstanceMetadata.verify|verify} messages.
                         * @param message CreateInstanceMetadata message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: google.spanner.admin.instance.v1.ICreateInstanceMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes a CreateInstanceMetadata message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns CreateInstanceMetadata
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.instance.v1.CreateInstanceMetadata;

                        /**
                         * Decodes a CreateInstanceMetadata message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns CreateInstanceMetadata
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.instance.v1.CreateInstanceMetadata;

                        /**
                         * Verifies a CreateInstanceMetadata message.
                         * @param message Plain object to verify
                         * @returns `null` if valid, otherwise the reason why it is not
                         */
                        public static verify(message: { [k: string]: any }): (string|null);

                        /**
                         * Creates a CreateInstanceMetadata message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns CreateInstanceMetadata
                         */
                        public static fromObject(object: { [k: string]: any }): google.spanner.admin.instance.v1.CreateInstanceMetadata;

                        /**
                         * Creates a plain object from a CreateInstanceMetadata message. Also converts values to other types if specified.
                         * @param message CreateInstanceMetadata
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: google.spanner.admin.instance.v1.CreateInstanceMetadata, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this CreateInstanceMetadata to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };
                    }

                    /** Properties of an UpdateInstanceMetadata. */
                    interface IUpdateInstanceMetadata {

                        /** UpdateInstanceMetadata instance */
                        instance?: (google.spanner.admin.instance.v1.IInstance|null);

                        /** UpdateInstanceMetadata startTime */
                        startTime?: (google.protobuf.ITimestamp|null);

                        /** UpdateInstanceMetadata cancelTime */
                        cancelTime?: (google.protobuf.ITimestamp|null);

                        /** UpdateInstanceMetadata endTime */
                        endTime?: (google.protobuf.ITimestamp|null);
                    }

                    /** Represents an UpdateInstanceMetadata. */
                    class UpdateInstanceMetadata implements IUpdateInstanceMetadata {

                        /**
                         * Constructs a new UpdateInstanceMetadata.
                         * @param [properties] Properties to set
                         */
                        constructor(properties?: google.spanner.admin.instance.v1.IUpdateInstanceMetadata);

                        /** UpdateInstanceMetadata instance. */
                        public instance?: (google.spanner.admin.instance.v1.IInstance|null);

                        /** UpdateInstanceMetadata startTime. */
                        public startTime?: (google.protobuf.ITimestamp|null);

                        /** UpdateInstanceMetadata cancelTime. */
                        public cancelTime?: (google.protobuf.ITimestamp|null);

                        /** UpdateInstanceMetadata endTime. */
                        public endTime?: (google.protobuf.ITimestamp|null);

                        /**
                         * Creates a new UpdateInstanceMetadata instance using the specified properties.
                         * @param [properties] Properties to set
                         * @returns UpdateInstanceMetadata instance
                         */
                        public static create(properties?: google.spanner.admin.instance.v1.IUpdateInstanceMetadata): google.spanner.admin.instance.v1.UpdateInstanceMetadata;

                        /**
                         * Encodes the specified UpdateInstanceMetadata message. Does not implicitly {@link google.spanner.admin.instance.v1.UpdateInstanceMetadata.verify|verify} messages.
                         * @param message UpdateInstanceMetadata message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encode(message: google.spanner.admin.instance.v1.IUpdateInstanceMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Encodes the specified UpdateInstanceMetadata message, length delimited. Does not implicitly {@link google.spanner.admin.instance.v1.UpdateInstanceMetadata.verify|verify} messages.
                         * @param message UpdateInstanceMetadata message or plain object to encode
                         * @param [writer] Writer to encode to
                         * @returns Writer
                         */
                        public static encodeDelimited(message: google.spanner.admin.instance.v1.IUpdateInstanceMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

                        /**
                         * Decodes an UpdateInstanceMetadata message from the specified reader or buffer.
                         * @param reader Reader or buffer to decode from
                         * @param [length] Message length if known beforehand
                         * @returns UpdateInstanceMetadata
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.admin.instance.v1.UpdateInstanceMetadata;

                        /**
                         * Decodes an UpdateInstanceMetadata message from the specified reader or buffer, length delimited.
                         * @param reader Reader or buffer to decode from
                         * @returns UpdateInstanceMetadata
                         * @throws {Error} If the payload is not a reader or valid buffer
                         * @throws {$protobuf.util.ProtocolError} If required fields are missing
                         */
                        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.admin.instance.v1.UpdateInstanceMetadata;

                        /**
                         * Verifies an UpdateInstanceMetadata message.
                         * @param message Plain object to verify
                         * @returns `null` if valid, otherwise the reason why it is not
                         */
                        public static verify(message: { [k: string]: any }): (string|null);

                        /**
                         * Creates an UpdateInstanceMetadata message from a plain object. Also converts values to their respective internal types.
                         * @param object Plain object
                         * @returns UpdateInstanceMetadata
                         */
                        public static fromObject(object: { [k: string]: any }): google.spanner.admin.instance.v1.UpdateInstanceMetadata;

                        /**
                         * Creates a plain object from an UpdateInstanceMetadata message. Also converts values to other types if specified.
                         * @param message UpdateInstanceMetadata
                         * @param [options] Conversion options
                         * @returns Plain object
                         */
                        public static toObject(message: google.spanner.admin.instance.v1.UpdateInstanceMetadata, options?: $protobuf.IConversionOptions): { [k: string]: any };

                        /**
                         * Converts this UpdateInstanceMetadata to JSON.
                         * @returns JSON object
                         */
                        public toJSON(): { [k: string]: any };
                    }
                }
            }
        }

        /** Namespace v1. */
        namespace v1 {

            /** Properties of a CommitResponse. */
            interface ICommitResponse {

                /** CommitResponse commitTimestamp */
                commitTimestamp?: (google.protobuf.ITimestamp|null);

                /** CommitResponse commitStats */
                commitStats?: (google.spanner.v1.CommitResponse.ICommitStats|null);
            }

            /** Represents a CommitResponse. */
            class CommitResponse implements ICommitResponse {

                /**
                 * Constructs a new CommitResponse.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.v1.ICommitResponse);

                /** CommitResponse commitTimestamp. */
                public commitTimestamp?: (google.protobuf.ITimestamp|null);

                /** CommitResponse commitStats. */
                public commitStats?: (google.spanner.v1.CommitResponse.ICommitStats|null);

                /**
                 * Creates a new CommitResponse instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns CommitResponse instance
                 */
                public static create(properties?: google.spanner.v1.ICommitResponse): google.spanner.v1.CommitResponse;

                /**
                 * Encodes the specified CommitResponse message. Does not implicitly {@link google.spanner.v1.CommitResponse.verify|verify} messages.
                 * @param message CommitResponse message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.v1.ICommitResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified CommitResponse message, length delimited. Does not implicitly {@link google.spanner.v1.CommitResponse.verify|verify} messages.
                 * @param message CommitResponse message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.v1.ICommitResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a CommitResponse message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns CommitResponse
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.v1.CommitResponse;

                /**
                 * Decodes a CommitResponse message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns CommitResponse
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.v1.CommitResponse;

                /**
                 * Verifies a CommitResponse message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a CommitResponse message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns CommitResponse
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.v1.CommitResponse;

                /**
                 * Creates a plain object from a CommitResponse message. Also converts values to other types if specified.
                 * @param message CommitResponse
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.v1.CommitResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this CommitResponse to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            namespace CommitResponse {

                /** Properties of a CommitStats. */
                interface ICommitStats {

                    /** CommitStats mutationCount */
                    mutationCount?: (number|Long|string|null);
                }

                /** Represents a CommitStats. */
                class CommitStats implements ICommitStats {

                    /**
                     * Constructs a new CommitStats.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: google.spanner.v1.CommitResponse.ICommitStats);

                    /** CommitStats mutationCount. */
                    public mutationCount: (number|Long|string);

                    /**
                     * Creates a new CommitStats instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns CommitStats instance
                     */
                    public static create(properties?: google.spanner.v1.CommitResponse.ICommitStats): google.spanner.v1.CommitResponse.CommitStats;

                    /**
                     * Encodes the specified CommitStats message. Does not implicitly {@link google.spanner.v1.CommitResponse.CommitStats.verify|verify} messages.
                     * @param message CommitStats message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: google.spanner.v1.CommitResponse.ICommitStats, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified CommitStats message, length delimited. Does not implicitly {@link google.spanner.v1.CommitResponse.CommitStats.verify|verify} messages.
                     * @param message CommitStats message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: google.spanner.v1.CommitResponse.ICommitStats, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a CommitStats message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns CommitStats
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.v1.CommitResponse.CommitStats;

                    /**
                     * Decodes a CommitStats message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns CommitStats
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.v1.CommitResponse.CommitStats;

                    /**
                     * Verifies a CommitStats message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a CommitStats message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns CommitStats
                     */
                    public static fromObject(object: { [k: string]: any }): google.spanner.v1.CommitResponse.CommitStats;

                    /**
                     * Creates a plain object from a CommitStats message. Also converts values to other types if specified.
                     * @param message CommitStats
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: google.spanner.v1.CommitResponse.CommitStats, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this CommitStats to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };
                }
            }

            /** Properties of a KeyRange. */
            interface IKeyRange {

                /** KeyRange startClosed */
                startClosed?: (google.protobuf.IListValue|null);

                /** KeyRange startOpen */
                startOpen?: (google.protobuf.IListValue|null);

                /** KeyRange endClosed */
                endClosed?: (google.protobuf.IListValue|null);

                /** KeyRange endOpen */
                endOpen?: (google.protobuf.IListValue|null);
            }

            /** Represents a KeyRange. */
            class KeyRange implements IKeyRange {

                /**
                 * Constructs a new KeyRange.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.v1.IKeyRange);

                /** KeyRange startClosed. */
                public startClosed?: (google.protobuf.IListValue|null);

                /** KeyRange startOpen. */
                public startOpen?: (google.protobuf.IListValue|null);

                /** KeyRange endClosed. */
                public endClosed?: (google.protobuf.IListValue|null);

                /** KeyRange endOpen. */
                public endOpen?: (google.protobuf.IListValue|null);

                /** KeyRange startKeyType. */
                public startKeyType?: ("startClosed"|"startOpen");

                /** KeyRange endKeyType. */
                public endKeyType?: ("endClosed"|"endOpen");

                /**
                 * Creates a new KeyRange instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns KeyRange instance
                 */
                public static create(properties?: google.spanner.v1.IKeyRange): google.spanner.v1.KeyRange;

                /**
                 * Encodes the specified KeyRange message. Does not implicitly {@link google.spanner.v1.KeyRange.verify|verify} messages.
                 * @param message KeyRange message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.v1.IKeyRange, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified KeyRange message, length delimited. Does not implicitly {@link google.spanner.v1.KeyRange.verify|verify} messages.
                 * @param message KeyRange message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.v1.IKeyRange, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a KeyRange message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns KeyRange
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.v1.KeyRange;

                /**
                 * Decodes a KeyRange message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns KeyRange
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.v1.KeyRange;

                /**
                 * Verifies a KeyRange message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a KeyRange message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns KeyRange
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.v1.KeyRange;

                /**
                 * Creates a plain object from a KeyRange message. Also converts values to other types if specified.
                 * @param message KeyRange
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.v1.KeyRange, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this KeyRange to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a KeySet. */
            interface IKeySet {

                /** KeySet keys */
                keys?: (google.protobuf.IListValue[]|null);

                /** KeySet ranges */
                ranges?: (google.spanner.v1.IKeyRange[]|null);

                /** KeySet all */
                all?: (boolean|null);
            }

            /** Represents a KeySet. */
            class KeySet implements IKeySet {

                /**
                 * Constructs a new KeySet.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.v1.IKeySet);

                /** KeySet keys. */
                public keys: google.protobuf.IListValue[];

                /** KeySet ranges. */
                public ranges: google.spanner.v1.IKeyRange[];

                /** KeySet all. */
                public all: boolean;

                /**
                 * Creates a new KeySet instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns KeySet instance
                 */
                public static create(properties?: google.spanner.v1.IKeySet): google.spanner.v1.KeySet;

                /**
                 * Encodes the specified KeySet message. Does not implicitly {@link google.spanner.v1.KeySet.verify|verify} messages.
                 * @param message KeySet message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.v1.IKeySet, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified KeySet message, length delimited. Does not implicitly {@link google.spanner.v1.KeySet.verify|verify} messages.
                 * @param message KeySet message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.v1.IKeySet, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a KeySet message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns KeySet
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.v1.KeySet;

                /**
                 * Decodes a KeySet message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns KeySet
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.v1.KeySet;

                /**
                 * Verifies a KeySet message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a KeySet message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns KeySet
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.v1.KeySet;

                /**
                 * Creates a plain object from a KeySet message. Also converts values to other types if specified.
                 * @param message KeySet
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.v1.KeySet, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this KeySet to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a Mutation. */
            interface IMutation {

                /** Mutation insert */
                insert?: (google.spanner.v1.Mutation.IWrite|null);

                /** Mutation update */
                update?: (google.spanner.v1.Mutation.IWrite|null);

                /** Mutation insertOrUpdate */
                insertOrUpdate?: (google.spanner.v1.Mutation.IWrite|null);

                /** Mutation replace */
                replace?: (google.spanner.v1.Mutation.IWrite|null);

                /** Mutation delete */
                "delete"?: (google.spanner.v1.Mutation.IDelete|null);
            }

            /** Represents a Mutation. */
            class Mutation implements IMutation {

                /**
                 * Constructs a new Mutation.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.v1.IMutation);

                /** Mutation insert. */
                public insert?: (google.spanner.v1.Mutation.IWrite|null);

                /** Mutation update. */
                public update?: (google.spanner.v1.Mutation.IWrite|null);

                /** Mutation insertOrUpdate. */
                public insertOrUpdate?: (google.spanner.v1.Mutation.IWrite|null);

                /** Mutation replace. */
                public replace?: (google.spanner.v1.Mutation.IWrite|null);

                /** Mutation delete. */
                public delete?: (google.spanner.v1.Mutation.IDelete|null);

                /** Mutation operation. */
                public operation?: ("insert"|"update"|"insertOrUpdate"|"replace"|"delete");

                /**
                 * Creates a new Mutation instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns Mutation instance
                 */
                public static create(properties?: google.spanner.v1.IMutation): google.spanner.v1.Mutation;

                /**
                 * Encodes the specified Mutation message. Does not implicitly {@link google.spanner.v1.Mutation.verify|verify} messages.
                 * @param message Mutation message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.v1.IMutation, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified Mutation message, length delimited. Does not implicitly {@link google.spanner.v1.Mutation.verify|verify} messages.
                 * @param message Mutation message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.v1.IMutation, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a Mutation message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns Mutation
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.v1.Mutation;

                /**
                 * Decodes a Mutation message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns Mutation
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.v1.Mutation;

                /**
                 * Verifies a Mutation message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a Mutation message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns Mutation
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.v1.Mutation;

                /**
                 * Creates a plain object from a Mutation message. Also converts values to other types if specified.
                 * @param message Mutation
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.v1.Mutation, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this Mutation to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            namespace Mutation {

                /** Properties of a Write. */
                interface IWrite {

                    /** Write table */
                    table?: (string|null);

                    /** Write columns */
                    columns?: (string[]|null);

                    /** Write values */
                    values?: (google.protobuf.IListValue[]|null);
                }

                /** Represents a Write. */
                class Write implements IWrite {

                    /**
                     * Constructs a new Write.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: google.spanner.v1.Mutation.IWrite);

                    /** Write table. */
                    public table: string;

                    /** Write columns. */
                    public columns: string[];

                    /** Write values. */
                    public values: google.protobuf.IListValue[];

                    /**
                     * Creates a new Write instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns Write instance
                     */
                    public static create(properties?: google.spanner.v1.Mutation.IWrite): google.spanner.v1.Mutation.Write;

                    /**
                     * Encodes the specified Write message. Does not implicitly {@link google.spanner.v1.Mutation.Write.verify|verify} messages.
                     * @param message Write message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: google.spanner.v1.Mutation.IWrite, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified Write message, length delimited. Does not implicitly {@link google.spanner.v1.Mutation.Write.verify|verify} messages.
                     * @param message Write message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: google.spanner.v1.Mutation.IWrite, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a Write message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns Write
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.v1.Mutation.Write;

                    /**
                     * Decodes a Write message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns Write
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.v1.Mutation.Write;

                    /**
                     * Verifies a Write message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a Write message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns Write
                     */
                    public static fromObject(object: { [k: string]: any }): google.spanner.v1.Mutation.Write;

                    /**
                     * Creates a plain object from a Write message. Also converts values to other types if specified.
                     * @param message Write
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: google.spanner.v1.Mutation.Write, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this Write to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };
                }

                /** Properties of a Delete. */
                interface IDelete {

                    /** Delete table */
                    table?: (string|null);

                    /** Delete keySet */
                    keySet?: (google.spanner.v1.IKeySet|null);
                }

                /** Represents a Delete. */
                class Delete implements IDelete {

                    /**
                     * Constructs a new Delete.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: google.spanner.v1.Mutation.IDelete);

                    /** Delete table. */
                    public table: string;

                    /** Delete keySet. */
                    public keySet?: (google.spanner.v1.IKeySet|null);

                    /**
                     * Creates a new Delete instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns Delete instance
                     */
                    public static create(properties?: google.spanner.v1.Mutation.IDelete): google.spanner.v1.Mutation.Delete;

                    /**
                     * Encodes the specified Delete message. Does not implicitly {@link google.spanner.v1.Mutation.Delete.verify|verify} messages.
                     * @param message Delete message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: google.spanner.v1.Mutation.IDelete, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified Delete message, length delimited. Does not implicitly {@link google.spanner.v1.Mutation.Delete.verify|verify} messages.
                     * @param message Delete message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: google.spanner.v1.Mutation.IDelete, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a Delete message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns Delete
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.v1.Mutation.Delete;

                    /**
                     * Decodes a Delete message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns Delete
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.v1.Mutation.Delete;

                    /**
                     * Verifies a Delete message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a Delete message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns Delete
                     */
                    public static fromObject(object: { [k: string]: any }): google.spanner.v1.Mutation.Delete;

                    /**
                     * Creates a plain object from a Delete message. Also converts values to other types if specified.
                     * @param message Delete
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: google.spanner.v1.Mutation.Delete, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this Delete to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };
                }
            }

            /** Properties of a PlanNode. */
            interface IPlanNode {

                /** PlanNode index */
                index?: (number|null);

                /** PlanNode kind */
                kind?: (google.spanner.v1.PlanNode.Kind|keyof typeof google.spanner.v1.PlanNode.Kind|null);

                /** PlanNode displayName */
                displayName?: (string|null);

                /** PlanNode childLinks */
                childLinks?: (google.spanner.v1.PlanNode.IChildLink[]|null);

                /** PlanNode shortRepresentation */
                shortRepresentation?: (google.spanner.v1.PlanNode.IShortRepresentation|null);

                /** PlanNode metadata */
                metadata?: (google.protobuf.IStruct|null);

                /** PlanNode executionStats */
                executionStats?: (google.protobuf.IStruct|null);
            }

            /** Represents a PlanNode. */
            class PlanNode implements IPlanNode {

                /**
                 * Constructs a new PlanNode.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.v1.IPlanNode);

                /** PlanNode index. */
                public index: number;

                /** PlanNode kind. */
                public kind: (google.spanner.v1.PlanNode.Kind|keyof typeof google.spanner.v1.PlanNode.Kind);

                /** PlanNode displayName. */
                public displayName: string;

                /** PlanNode childLinks. */
                public childLinks: google.spanner.v1.PlanNode.IChildLink[];

                /** PlanNode shortRepresentation. */
                public shortRepresentation?: (google.spanner.v1.PlanNode.IShortRepresentation|null);

                /** PlanNode metadata. */
                public metadata?: (google.protobuf.IStruct|null);

                /** PlanNode executionStats. */
                public executionStats?: (google.protobuf.IStruct|null);

                /**
                 * Creates a new PlanNode instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns PlanNode instance
                 */
                public static create(properties?: google.spanner.v1.IPlanNode): google.spanner.v1.PlanNode;

                /**
                 * Encodes the specified PlanNode message. Does not implicitly {@link google.spanner.v1.PlanNode.verify|verify} messages.
                 * @param message PlanNode message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.v1.IPlanNode, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified PlanNode message, length delimited. Does not implicitly {@link google.spanner.v1.PlanNode.verify|verify} messages.
                 * @param message PlanNode message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.v1.IPlanNode, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a PlanNode message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns PlanNode
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.v1.PlanNode;

                /**
                 * Decodes a PlanNode message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns PlanNode
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.v1.PlanNode;

                /**
                 * Verifies a PlanNode message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a PlanNode message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns PlanNode
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.v1.PlanNode;

                /**
                 * Creates a plain object from a PlanNode message. Also converts values to other types if specified.
                 * @param message PlanNode
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.v1.PlanNode, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this PlanNode to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            namespace PlanNode {

                /** Kind enum. */
                enum Kind {
                    KIND_UNSPECIFIED = 0,
                    RELATIONAL = 1,
                    SCALAR = 2
                }

                /** Properties of a ChildLink. */
                interface IChildLink {

                    /** ChildLink childIndex */
                    childIndex?: (number|null);

                    /** ChildLink type */
                    type?: (string|null);

                    /** ChildLink variable */
                    variable?: (string|null);
                }

                /** Represents a ChildLink. */
                class ChildLink implements IChildLink {

                    /**
                     * Constructs a new ChildLink.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: google.spanner.v1.PlanNode.IChildLink);

                    /** ChildLink childIndex. */
                    public childIndex: number;

                    /** ChildLink type. */
                    public type: string;

                    /** ChildLink variable. */
                    public variable: string;

                    /**
                     * Creates a new ChildLink instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns ChildLink instance
                     */
                    public static create(properties?: google.spanner.v1.PlanNode.IChildLink): google.spanner.v1.PlanNode.ChildLink;

                    /**
                     * Encodes the specified ChildLink message. Does not implicitly {@link google.spanner.v1.PlanNode.ChildLink.verify|verify} messages.
                     * @param message ChildLink message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: google.spanner.v1.PlanNode.IChildLink, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified ChildLink message, length delimited. Does not implicitly {@link google.spanner.v1.PlanNode.ChildLink.verify|verify} messages.
                     * @param message ChildLink message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: google.spanner.v1.PlanNode.IChildLink, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a ChildLink message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns ChildLink
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.v1.PlanNode.ChildLink;

                    /**
                     * Decodes a ChildLink message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns ChildLink
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.v1.PlanNode.ChildLink;

                    /**
                     * Verifies a ChildLink message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a ChildLink message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns ChildLink
                     */
                    public static fromObject(object: { [k: string]: any }): google.spanner.v1.PlanNode.ChildLink;

                    /**
                     * Creates a plain object from a ChildLink message. Also converts values to other types if specified.
                     * @param message ChildLink
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: google.spanner.v1.PlanNode.ChildLink, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this ChildLink to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };
                }

                /** Properties of a ShortRepresentation. */
                interface IShortRepresentation {

                    /** ShortRepresentation description */
                    description?: (string|null);

                    /** ShortRepresentation subqueries */
                    subqueries?: ({ [k: string]: number }|null);
                }

                /** Represents a ShortRepresentation. */
                class ShortRepresentation implements IShortRepresentation {

                    /**
                     * Constructs a new ShortRepresentation.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: google.spanner.v1.PlanNode.IShortRepresentation);

                    /** ShortRepresentation description. */
                    public description: string;

                    /** ShortRepresentation subqueries. */
                    public subqueries: { [k: string]: number };

                    /**
                     * Creates a new ShortRepresentation instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns ShortRepresentation instance
                     */
                    public static create(properties?: google.spanner.v1.PlanNode.IShortRepresentation): google.spanner.v1.PlanNode.ShortRepresentation;

                    /**
                     * Encodes the specified ShortRepresentation message. Does not implicitly {@link google.spanner.v1.PlanNode.ShortRepresentation.verify|verify} messages.
                     * @param message ShortRepresentation message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: google.spanner.v1.PlanNode.IShortRepresentation, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified ShortRepresentation message, length delimited. Does not implicitly {@link google.spanner.v1.PlanNode.ShortRepresentation.verify|verify} messages.
                     * @param message ShortRepresentation message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: google.spanner.v1.PlanNode.IShortRepresentation, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a ShortRepresentation message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns ShortRepresentation
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.v1.PlanNode.ShortRepresentation;

                    /**
                     * Decodes a ShortRepresentation message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns ShortRepresentation
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.v1.PlanNode.ShortRepresentation;

                    /**
                     * Verifies a ShortRepresentation message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a ShortRepresentation message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns ShortRepresentation
                     */
                    public static fromObject(object: { [k: string]: any }): google.spanner.v1.PlanNode.ShortRepresentation;

                    /**
                     * Creates a plain object from a ShortRepresentation message. Also converts values to other types if specified.
                     * @param message ShortRepresentation
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: google.spanner.v1.PlanNode.ShortRepresentation, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this ShortRepresentation to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };
                }
            }

            /** Properties of a QueryPlan. */
            interface IQueryPlan {

                /** QueryPlan planNodes */
                planNodes?: (google.spanner.v1.IPlanNode[]|null);
            }

            /** Represents a QueryPlan. */
            class QueryPlan implements IQueryPlan {

                /**
                 * Constructs a new QueryPlan.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.v1.IQueryPlan);

                /** QueryPlan planNodes. */
                public planNodes: google.spanner.v1.IPlanNode[];

                /**
                 * Creates a new QueryPlan instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns QueryPlan instance
                 */
                public static create(properties?: google.spanner.v1.IQueryPlan): google.spanner.v1.QueryPlan;

                /**
                 * Encodes the specified QueryPlan message. Does not implicitly {@link google.spanner.v1.QueryPlan.verify|verify} messages.
                 * @param message QueryPlan message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.v1.IQueryPlan, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified QueryPlan message, length delimited. Does not implicitly {@link google.spanner.v1.QueryPlan.verify|verify} messages.
                 * @param message QueryPlan message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.v1.IQueryPlan, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a QueryPlan message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns QueryPlan
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.v1.QueryPlan;

                /**
                 * Decodes a QueryPlan message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns QueryPlan
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.v1.QueryPlan;

                /**
                 * Verifies a QueryPlan message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a QueryPlan message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns QueryPlan
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.v1.QueryPlan;

                /**
                 * Creates a plain object from a QueryPlan message. Also converts values to other types if specified.
                 * @param message QueryPlan
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.v1.QueryPlan, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this QueryPlan to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a ResultSet. */
            interface IResultSet {

                /** ResultSet metadata */
                metadata?: (google.spanner.v1.IResultSetMetadata|null);

                /** ResultSet rows */
                rows?: (google.protobuf.IListValue[]|null);

                /** ResultSet stats */
                stats?: (google.spanner.v1.IResultSetStats|null);
            }

            /** Represents a ResultSet. */
            class ResultSet implements IResultSet {

                /**
                 * Constructs a new ResultSet.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.v1.IResultSet);

                /** ResultSet metadata. */
                public metadata?: (google.spanner.v1.IResultSetMetadata|null);

                /** ResultSet rows. */
                public rows: google.protobuf.IListValue[];

                /** ResultSet stats. */
                public stats?: (google.spanner.v1.IResultSetStats|null);

                /**
                 * Creates a new ResultSet instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns ResultSet instance
                 */
                public static create(properties?: google.spanner.v1.IResultSet): google.spanner.v1.ResultSet;

                /**
                 * Encodes the specified ResultSet message. Does not implicitly {@link google.spanner.v1.ResultSet.verify|verify} messages.
                 * @param message ResultSet message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.v1.IResultSet, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified ResultSet message, length delimited. Does not implicitly {@link google.spanner.v1.ResultSet.verify|verify} messages.
                 * @param message ResultSet message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.v1.IResultSet, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a ResultSet message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns ResultSet
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.v1.ResultSet;

                /**
                 * Decodes a ResultSet message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns ResultSet
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.v1.ResultSet;

                /**
                 * Verifies a ResultSet message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a ResultSet message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns ResultSet
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.v1.ResultSet;

                /**
                 * Creates a plain object from a ResultSet message. Also converts values to other types if specified.
                 * @param message ResultSet
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.v1.ResultSet, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this ResultSet to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a PartialResultSet. */
            interface IPartialResultSet {

                /** PartialResultSet metadata */
                metadata?: (google.spanner.v1.IResultSetMetadata|null);

                /** PartialResultSet values */
                values?: (google.protobuf.IValue[]|null);

                /** PartialResultSet chunkedValue */
                chunkedValue?: (boolean|null);

                /** PartialResultSet resumeToken */
                resumeToken?: (Uint8Array|string|null);

                /** PartialResultSet stats */
                stats?: (google.spanner.v1.IResultSetStats|null);
            }

            /** Represents a PartialResultSet. */
            class PartialResultSet implements IPartialResultSet {

                /**
                 * Constructs a new PartialResultSet.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.v1.IPartialResultSet);

                /** PartialResultSet metadata. */
                public metadata?: (google.spanner.v1.IResultSetMetadata|null);

                /** PartialResultSet values. */
                public values: google.protobuf.IValue[];

                /** PartialResultSet chunkedValue. */
                public chunkedValue: boolean;

                /** PartialResultSet resumeToken. */
                public resumeToken: (Uint8Array|string);

                /** PartialResultSet stats. */
                public stats?: (google.spanner.v1.IResultSetStats|null);

                /**
                 * Creates a new PartialResultSet instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns PartialResultSet instance
                 */
                public static create(properties?: google.spanner.v1.IPartialResultSet): google.spanner.v1.PartialResultSet;

                /**
                 * Encodes the specified PartialResultSet message. Does not implicitly {@link google.spanner.v1.PartialResultSet.verify|verify} messages.
                 * @param message PartialResultSet message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.v1.IPartialResultSet, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified PartialResultSet message, length delimited. Does not implicitly {@link google.spanner.v1.PartialResultSet.verify|verify} messages.
                 * @param message PartialResultSet message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.v1.IPartialResultSet, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a PartialResultSet message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns PartialResultSet
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.v1.PartialResultSet;

                /**
                 * Decodes a PartialResultSet message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns PartialResultSet
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.v1.PartialResultSet;

                /**
                 * Verifies a PartialResultSet message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a PartialResultSet message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns PartialResultSet
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.v1.PartialResultSet;

                /**
                 * Creates a plain object from a PartialResultSet message. Also converts values to other types if specified.
                 * @param message PartialResultSet
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.v1.PartialResultSet, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this PartialResultSet to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a ResultSetMetadata. */
            interface IResultSetMetadata {

                /** ResultSetMetadata rowType */
                rowType?: (google.spanner.v1.IStructType|null);

                /** ResultSetMetadata transaction */
                transaction?: (google.spanner.v1.ITransaction|null);
            }

            /** Represents a ResultSetMetadata. */
            class ResultSetMetadata implements IResultSetMetadata {

                /**
                 * Constructs a new ResultSetMetadata.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.v1.IResultSetMetadata);

                /** ResultSetMetadata rowType. */
                public rowType?: (google.spanner.v1.IStructType|null);

                /** ResultSetMetadata transaction. */
                public transaction?: (google.spanner.v1.ITransaction|null);

                /**
                 * Creates a new ResultSetMetadata instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns ResultSetMetadata instance
                 */
                public static create(properties?: google.spanner.v1.IResultSetMetadata): google.spanner.v1.ResultSetMetadata;

                /**
                 * Encodes the specified ResultSetMetadata message. Does not implicitly {@link google.spanner.v1.ResultSetMetadata.verify|verify} messages.
                 * @param message ResultSetMetadata message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.v1.IResultSetMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified ResultSetMetadata message, length delimited. Does not implicitly {@link google.spanner.v1.ResultSetMetadata.verify|verify} messages.
                 * @param message ResultSetMetadata message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.v1.IResultSetMetadata, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a ResultSetMetadata message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns ResultSetMetadata
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.v1.ResultSetMetadata;

                /**
                 * Decodes a ResultSetMetadata message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns ResultSetMetadata
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.v1.ResultSetMetadata;

                /**
                 * Verifies a ResultSetMetadata message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a ResultSetMetadata message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns ResultSetMetadata
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.v1.ResultSetMetadata;

                /**
                 * Creates a plain object from a ResultSetMetadata message. Also converts values to other types if specified.
                 * @param message ResultSetMetadata
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.v1.ResultSetMetadata, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this ResultSetMetadata to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a ResultSetStats. */
            interface IResultSetStats {

                /** ResultSetStats queryPlan */
                queryPlan?: (google.spanner.v1.IQueryPlan|null);

                /** ResultSetStats queryStats */
                queryStats?: (google.protobuf.IStruct|null);

                /** ResultSetStats rowCountExact */
                rowCountExact?: (number|Long|string|null);

                /** ResultSetStats rowCountLowerBound */
                rowCountLowerBound?: (number|Long|string|null);
            }

            /** Represents a ResultSetStats. */
            class ResultSetStats implements IResultSetStats {

                /**
                 * Constructs a new ResultSetStats.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.v1.IResultSetStats);

                /** ResultSetStats queryPlan. */
                public queryPlan?: (google.spanner.v1.IQueryPlan|null);

                /** ResultSetStats queryStats. */
                public queryStats?: (google.protobuf.IStruct|null);

                /** ResultSetStats rowCountExact. */
                public rowCountExact?: (number|Long|string|null);

                /** ResultSetStats rowCountLowerBound. */
                public rowCountLowerBound?: (number|Long|string|null);

                /** ResultSetStats rowCount. */
                public rowCount?: ("rowCountExact"|"rowCountLowerBound");

                /**
                 * Creates a new ResultSetStats instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns ResultSetStats instance
                 */
                public static create(properties?: google.spanner.v1.IResultSetStats): google.spanner.v1.ResultSetStats;

                /**
                 * Encodes the specified ResultSetStats message. Does not implicitly {@link google.spanner.v1.ResultSetStats.verify|verify} messages.
                 * @param message ResultSetStats message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.v1.IResultSetStats, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified ResultSetStats message, length delimited. Does not implicitly {@link google.spanner.v1.ResultSetStats.verify|verify} messages.
                 * @param message ResultSetStats message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.v1.IResultSetStats, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a ResultSetStats message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns ResultSetStats
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.v1.ResultSetStats;

                /**
                 * Decodes a ResultSetStats message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns ResultSetStats
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.v1.ResultSetStats;

                /**
                 * Verifies a ResultSetStats message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a ResultSetStats message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns ResultSetStats
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.v1.ResultSetStats;

                /**
                 * Creates a plain object from a ResultSetStats message. Also converts values to other types if specified.
                 * @param message ResultSetStats
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.v1.ResultSetStats, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this ResultSetStats to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a TransactionOptions. */
            interface ITransactionOptions {

                /** TransactionOptions readWrite */
                readWrite?: (google.spanner.v1.TransactionOptions.IReadWrite|null);

                /** TransactionOptions partitionedDml */
                partitionedDml?: (google.spanner.v1.TransactionOptions.IPartitionedDml|null);

                /** TransactionOptions readOnly */
                readOnly?: (google.spanner.v1.TransactionOptions.IReadOnly|null);
            }

            /** Represents a TransactionOptions. */
            class TransactionOptions implements ITransactionOptions {

                /**
                 * Constructs a new TransactionOptions.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.v1.ITransactionOptions);

                /** TransactionOptions readWrite. */
                public readWrite?: (google.spanner.v1.TransactionOptions.IReadWrite|null);

                /** TransactionOptions partitionedDml. */
                public partitionedDml?: (google.spanner.v1.TransactionOptions.IPartitionedDml|null);

                /** TransactionOptions readOnly. */
                public readOnly?: (google.spanner.v1.TransactionOptions.IReadOnly|null);

                /** TransactionOptions mode. */
                public mode?: ("readWrite"|"partitionedDml"|"readOnly");

                /**
                 * Creates a new TransactionOptions instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns TransactionOptions instance
                 */
                public static create(properties?: google.spanner.v1.ITransactionOptions): google.spanner.v1.TransactionOptions;

                /**
                 * Encodes the specified TransactionOptions message. Does not implicitly {@link google.spanner.v1.TransactionOptions.verify|verify} messages.
                 * @param message TransactionOptions message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.v1.ITransactionOptions, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified TransactionOptions message, length delimited. Does not implicitly {@link google.spanner.v1.TransactionOptions.verify|verify} messages.
                 * @param message TransactionOptions message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.v1.ITransactionOptions, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a TransactionOptions message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns TransactionOptions
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.v1.TransactionOptions;

                /**
                 * Decodes a TransactionOptions message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns TransactionOptions
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.v1.TransactionOptions;

                /**
                 * Verifies a TransactionOptions message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a TransactionOptions message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns TransactionOptions
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.v1.TransactionOptions;

                /**
                 * Creates a plain object from a TransactionOptions message. Also converts values to other types if specified.
                 * @param message TransactionOptions
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.v1.TransactionOptions, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this TransactionOptions to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            namespace TransactionOptions {

                /** Properties of a ReadWrite. */
                interface IReadWrite {
                }

                /** Represents a ReadWrite. */
                class ReadWrite implements IReadWrite {

                    /**
                     * Constructs a new ReadWrite.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: google.spanner.v1.TransactionOptions.IReadWrite);

                    /**
                     * Creates a new ReadWrite instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns ReadWrite instance
                     */
                    public static create(properties?: google.spanner.v1.TransactionOptions.IReadWrite): google.spanner.v1.TransactionOptions.ReadWrite;

                    /**
                     * Encodes the specified ReadWrite message. Does not implicitly {@link google.spanner.v1.TransactionOptions.ReadWrite.verify|verify} messages.
                     * @param message ReadWrite message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: google.spanner.v1.TransactionOptions.IReadWrite, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified ReadWrite message, length delimited. Does not implicitly {@link google.spanner.v1.TransactionOptions.ReadWrite.verify|verify} messages.
                     * @param message ReadWrite message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: google.spanner.v1.TransactionOptions.IReadWrite, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a ReadWrite message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns ReadWrite
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.v1.TransactionOptions.ReadWrite;

                    /**
                     * Decodes a ReadWrite message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns ReadWrite
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.v1.TransactionOptions.ReadWrite;

                    /**
                     * Verifies a ReadWrite message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a ReadWrite message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns ReadWrite
                     */
                    public static fromObject(object: { [k: string]: any }): google.spanner.v1.TransactionOptions.ReadWrite;

                    /**
                     * Creates a plain object from a ReadWrite message. Also converts values to other types if specified.
                     * @param message ReadWrite
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: google.spanner.v1.TransactionOptions.ReadWrite, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this ReadWrite to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };
                }

                /** Properties of a PartitionedDml. */
                interface IPartitionedDml {
                }

                /** Represents a PartitionedDml. */
                class PartitionedDml implements IPartitionedDml {

                    /**
                     * Constructs a new PartitionedDml.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: google.spanner.v1.TransactionOptions.IPartitionedDml);

                    /**
                     * Creates a new PartitionedDml instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns PartitionedDml instance
                     */
                    public static create(properties?: google.spanner.v1.TransactionOptions.IPartitionedDml): google.spanner.v1.TransactionOptions.PartitionedDml;

                    /**
                     * Encodes the specified PartitionedDml message. Does not implicitly {@link google.spanner.v1.TransactionOptions.PartitionedDml.verify|verify} messages.
                     * @param message PartitionedDml message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: google.spanner.v1.TransactionOptions.IPartitionedDml, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified PartitionedDml message, length delimited. Does not implicitly {@link google.spanner.v1.TransactionOptions.PartitionedDml.verify|verify} messages.
                     * @param message PartitionedDml message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: google.spanner.v1.TransactionOptions.IPartitionedDml, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a PartitionedDml message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns PartitionedDml
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.v1.TransactionOptions.PartitionedDml;

                    /**
                     * Decodes a PartitionedDml message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns PartitionedDml
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.v1.TransactionOptions.PartitionedDml;

                    /**
                     * Verifies a PartitionedDml message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a PartitionedDml message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns PartitionedDml
                     */
                    public static fromObject(object: { [k: string]: any }): google.spanner.v1.TransactionOptions.PartitionedDml;

                    /**
                     * Creates a plain object from a PartitionedDml message. Also converts values to other types if specified.
                     * @param message PartitionedDml
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: google.spanner.v1.TransactionOptions.PartitionedDml, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this PartitionedDml to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };
                }

                /** Properties of a ReadOnly. */
                interface IReadOnly {

                    /** ReadOnly strong */
                    strong?: (boolean|null);

                    /** ReadOnly minReadTimestamp */
                    minReadTimestamp?: (google.protobuf.ITimestamp|null);

                    /** ReadOnly maxStaleness */
                    maxStaleness?: (google.protobuf.IDuration|null);

                    /** ReadOnly readTimestamp */
                    readTimestamp?: (google.protobuf.ITimestamp|null);

                    /** ReadOnly exactStaleness */
                    exactStaleness?: (google.protobuf.IDuration|null);

                    /** ReadOnly returnReadTimestamp */
                    returnReadTimestamp?: (boolean|null);
                }

                /** Represents a ReadOnly. */
                class ReadOnly implements IReadOnly {

                    /**
                     * Constructs a new ReadOnly.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: google.spanner.v1.TransactionOptions.IReadOnly);

                    /** ReadOnly strong. */
                    public strong?: (boolean|null);

                    /** ReadOnly minReadTimestamp. */
                    public minReadTimestamp?: (google.protobuf.ITimestamp|null);

                    /** ReadOnly maxStaleness. */
                    public maxStaleness?: (google.protobuf.IDuration|null);

                    /** ReadOnly readTimestamp. */
                    public readTimestamp?: (google.protobuf.ITimestamp|null);

                    /** ReadOnly exactStaleness. */
                    public exactStaleness?: (google.protobuf.IDuration|null);

                    /** ReadOnly returnReadTimestamp. */
                    public returnReadTimestamp: boolean;

                    /** ReadOnly timestampBound. */
                    public timestampBound?: ("strong"|"minReadTimestamp"|"maxStaleness"|"readTimestamp"|"exactStaleness");

                    /**
                     * Creates a new ReadOnly instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns ReadOnly instance
                     */
                    public static create(properties?: google.spanner.v1.TransactionOptions.IReadOnly): google.spanner.v1.TransactionOptions.ReadOnly;

                    /**
                     * Encodes the specified ReadOnly message. Does not implicitly {@link google.spanner.v1.TransactionOptions.ReadOnly.verify|verify} messages.
                     * @param message ReadOnly message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: google.spanner.v1.TransactionOptions.IReadOnly, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified ReadOnly message, length delimited. Does not implicitly {@link google.spanner.v1.TransactionOptions.ReadOnly.verify|verify} messages.
                     * @param message ReadOnly message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: google.spanner.v1.TransactionOptions.IReadOnly, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a ReadOnly message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns ReadOnly
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.v1.TransactionOptions.ReadOnly;

                    /**
                     * Decodes a ReadOnly message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns ReadOnly
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.v1.TransactionOptions.ReadOnly;

                    /**
                     * Verifies a ReadOnly message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a ReadOnly message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns ReadOnly
                     */
                    public static fromObject(object: { [k: string]: any }): google.spanner.v1.TransactionOptions.ReadOnly;

                    /**
                     * Creates a plain object from a ReadOnly message. Also converts values to other types if specified.
                     * @param message ReadOnly
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: google.spanner.v1.TransactionOptions.ReadOnly, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this ReadOnly to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };
                }
            }

            /** Properties of a Transaction. */
            interface ITransaction {

                /** Transaction id */
                id?: (Uint8Array|string|null);

                /** Transaction readTimestamp */
                readTimestamp?: (google.protobuf.ITimestamp|null);
            }

            /** Represents a Transaction. */
            class Transaction implements ITransaction {

                /**
                 * Constructs a new Transaction.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.v1.ITransaction);

                /** Transaction id. */
                public id: (Uint8Array|string);

                /** Transaction readTimestamp. */
                public readTimestamp?: (google.protobuf.ITimestamp|null);

                /**
                 * Creates a new Transaction instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns Transaction instance
                 */
                public static create(properties?: google.spanner.v1.ITransaction): google.spanner.v1.Transaction;

                /**
                 * Encodes the specified Transaction message. Does not implicitly {@link google.spanner.v1.Transaction.verify|verify} messages.
                 * @param message Transaction message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.v1.ITransaction, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified Transaction message, length delimited. Does not implicitly {@link google.spanner.v1.Transaction.verify|verify} messages.
                 * @param message Transaction message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.v1.ITransaction, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a Transaction message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns Transaction
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.v1.Transaction;

                /**
                 * Decodes a Transaction message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns Transaction
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.v1.Transaction;

                /**
                 * Verifies a Transaction message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a Transaction message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns Transaction
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.v1.Transaction;

                /**
                 * Creates a plain object from a Transaction message. Also converts values to other types if specified.
                 * @param message Transaction
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.v1.Transaction, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this Transaction to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a TransactionSelector. */
            interface ITransactionSelector {

                /** TransactionSelector singleUse */
                singleUse?: (google.spanner.v1.ITransactionOptions|null);

                /** TransactionSelector id */
                id?: (Uint8Array|string|null);

                /** TransactionSelector begin */
                begin?: (google.spanner.v1.ITransactionOptions|null);
            }

            /** Represents a TransactionSelector. */
            class TransactionSelector implements ITransactionSelector {

                /**
                 * Constructs a new TransactionSelector.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.v1.ITransactionSelector);

                /** TransactionSelector singleUse. */
                public singleUse?: (google.spanner.v1.ITransactionOptions|null);

                /** TransactionSelector id. */
                public id?: (Uint8Array|string|null);

                /** TransactionSelector begin. */
                public begin?: (google.spanner.v1.ITransactionOptions|null);

                /** TransactionSelector selector. */
                public selector?: ("singleUse"|"id"|"begin");

                /**
                 * Creates a new TransactionSelector instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns TransactionSelector instance
                 */
                public static create(properties?: google.spanner.v1.ITransactionSelector): google.spanner.v1.TransactionSelector;

                /**
                 * Encodes the specified TransactionSelector message. Does not implicitly {@link google.spanner.v1.TransactionSelector.verify|verify} messages.
                 * @param message TransactionSelector message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.v1.ITransactionSelector, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified TransactionSelector message, length delimited. Does not implicitly {@link google.spanner.v1.TransactionSelector.verify|verify} messages.
                 * @param message TransactionSelector message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.v1.ITransactionSelector, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a TransactionSelector message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns TransactionSelector
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.v1.TransactionSelector;

                /**
                 * Decodes a TransactionSelector message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns TransactionSelector
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.v1.TransactionSelector;

                /**
                 * Verifies a TransactionSelector message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a TransactionSelector message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns TransactionSelector
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.v1.TransactionSelector;

                /**
                 * Creates a plain object from a TransactionSelector message. Also converts values to other types if specified.
                 * @param message TransactionSelector
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.v1.TransactionSelector, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this TransactionSelector to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a Type. */
            interface IType {

                /** Type code */
                code?: (google.spanner.v1.TypeCode|keyof typeof google.spanner.v1.TypeCode|null);

                /** Type arrayElementType */
                arrayElementType?: (google.spanner.v1.IType|null);

                /** Type structType */
                structType?: (google.spanner.v1.IStructType|null);

                /** Type typeAnnotation */
                typeAnnotation?: (google.spanner.v1.TypeAnnotationCode|keyof typeof google.spanner.v1.TypeAnnotationCode|null);
            }

            /** Represents a Type. */
            class Type implements IType {

                /**
                 * Constructs a new Type.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.v1.IType);

                /** Type code. */
                public code: (google.spanner.v1.TypeCode|keyof typeof google.spanner.v1.TypeCode);

                /** Type arrayElementType. */
                public arrayElementType?: (google.spanner.v1.IType|null);

                /** Type structType. */
                public structType?: (google.spanner.v1.IStructType|null);

                /** Type typeAnnotation. */
                public typeAnnotation: (google.spanner.v1.TypeAnnotationCode|keyof typeof google.spanner.v1.TypeAnnotationCode);

                /**
                 * Creates a new Type instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns Type instance
                 */
                public static create(properties?: google.spanner.v1.IType): google.spanner.v1.Type;

                /**
                 * Encodes the specified Type message. Does not implicitly {@link google.spanner.v1.Type.verify|verify} messages.
                 * @param message Type message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.v1.IType, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified Type message, length delimited. Does not implicitly {@link google.spanner.v1.Type.verify|verify} messages.
                 * @param message Type message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.v1.IType, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a Type message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns Type
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.v1.Type;

                /**
                 * Decodes a Type message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns Type
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.v1.Type;

                /**
                 * Verifies a Type message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a Type message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns Type
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.v1.Type;

                /**
                 * Creates a plain object from a Type message. Also converts values to other types if specified.
                 * @param message Type
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.v1.Type, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this Type to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a StructType. */
            interface IStructType {

                /** StructType fields */
                fields?: (google.spanner.v1.StructType.IField[]|null);
            }

            /** Represents a StructType. */
            class StructType implements IStructType {

                /**
                 * Constructs a new StructType.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.v1.IStructType);

                /** StructType fields. */
                public fields: google.spanner.v1.StructType.IField[];

                /**
                 * Creates a new StructType instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns StructType instance
                 */
                public static create(properties?: google.spanner.v1.IStructType): google.spanner.v1.StructType;

                /**
                 * Encodes the specified StructType message. Does not implicitly {@link google.spanner.v1.StructType.verify|verify} messages.
                 * @param message StructType message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.v1.IStructType, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified StructType message, length delimited. Does not implicitly {@link google.spanner.v1.StructType.verify|verify} messages.
                 * @param message StructType message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.v1.IStructType, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a StructType message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns StructType
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.v1.StructType;

                /**
                 * Decodes a StructType message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns StructType
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.v1.StructType;

                /**
                 * Verifies a StructType message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a StructType message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns StructType
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.v1.StructType;

                /**
                 * Creates a plain object from a StructType message. Also converts values to other types if specified.
                 * @param message StructType
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.v1.StructType, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this StructType to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            namespace StructType {

                /** Properties of a Field. */
                interface IField {

                    /** Field name */
                    name?: (string|null);

                    /** Field type */
                    type?: (google.spanner.v1.IType|null);
                }

                /** Represents a Field. */
                class Field implements IField {

                    /**
                     * Constructs a new Field.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: google.spanner.v1.StructType.IField);

                    /** Field name. */
                    public name: string;

                    /** Field type. */
                    public type?: (google.spanner.v1.IType|null);

                    /**
                     * Creates a new Field instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns Field instance
                     */
                    public static create(properties?: google.spanner.v1.StructType.IField): google.spanner.v1.StructType.Field;

                    /**
                     * Encodes the specified Field message. Does not implicitly {@link google.spanner.v1.StructType.Field.verify|verify} messages.
                     * @param message Field message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: google.spanner.v1.StructType.IField, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified Field message, length delimited. Does not implicitly {@link google.spanner.v1.StructType.Field.verify|verify} messages.
                     * @param message Field message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: google.spanner.v1.StructType.IField, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a Field message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns Field
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.v1.StructType.Field;

                    /**
                     * Decodes a Field message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns Field
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.v1.StructType.Field;

                    /**
                     * Verifies a Field message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a Field message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns Field
                     */
                    public static fromObject(object: { [k: string]: any }): google.spanner.v1.StructType.Field;

                    /**
                     * Creates a plain object from a Field message. Also converts values to other types if specified.
                     * @param message Field
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: google.spanner.v1.StructType.Field, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this Field to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };
                }
            }

            /** TypeCode enum. */
            enum TypeCode {
                TYPE_CODE_UNSPECIFIED = 0,
                BOOL = 1,
                INT64 = 2,
                FLOAT64 = 3,
                TIMESTAMP = 4,
                DATE = 5,
                STRING = 6,
                BYTES = 7,
                ARRAY = 8,
                STRUCT = 9,
                NUMERIC = 10,
                JSON = 11
            }

            /** TypeAnnotationCode enum. */
            enum TypeAnnotationCode {
                TYPE_ANNOTATION_CODE_UNSPECIFIED = 0,
                PG_NUMERIC = 2
            }

            /** Represents a Spanner */
            class Spanner extends $protobuf.rpc.Service {

                /**
                 * Constructs a new Spanner service.
                 * @param rpcImpl RPC implementation
                 * @param [requestDelimited=false] Whether requests are length-delimited
                 * @param [responseDelimited=false] Whether responses are length-delimited
                 */
                constructor(rpcImpl: $protobuf.RPCImpl, requestDelimited?: boolean, responseDelimited?: boolean);

                /**
                 * Creates new Spanner service using the specified rpc implementation.
                 * @param rpcImpl RPC implementation
                 * @param [requestDelimited=false] Whether requests are length-delimited
                 * @param [responseDelimited=false] Whether responses are length-delimited
                 * @returns RPC service. Useful where requests and/or responses are streamed.
                 */
                public static create(rpcImpl: $protobuf.RPCImpl, requestDelimited?: boolean, responseDelimited?: boolean): Spanner;

                /**
                 * Calls CreateSession.
                 * @param request CreateSessionRequest message or plain object
                 * @param callback Node-style callback called with the error, if any, and Session
                 */
                public createSession(request: google.spanner.v1.ICreateSessionRequest, callback: google.spanner.v1.Spanner.CreateSessionCallback): void;

                /**
                 * Calls CreateSession.
                 * @param request CreateSessionRequest message or plain object
                 * @returns Promise
                 */
                public createSession(request: google.spanner.v1.ICreateSessionRequest): Promise<google.spanner.v1.Session>;

                /**
                 * Calls BatchCreateSessions.
                 * @param request BatchCreateSessionsRequest message or plain object
                 * @param callback Node-style callback called with the error, if any, and BatchCreateSessionsResponse
                 */
                public batchCreateSessions(request: google.spanner.v1.IBatchCreateSessionsRequest, callback: google.spanner.v1.Spanner.BatchCreateSessionsCallback): void;

                /**
                 * Calls BatchCreateSessions.
                 * @param request BatchCreateSessionsRequest message or plain object
                 * @returns Promise
                 */
                public batchCreateSessions(request: google.spanner.v1.IBatchCreateSessionsRequest): Promise<google.spanner.v1.BatchCreateSessionsResponse>;

                /**
                 * Calls GetSession.
                 * @param request GetSessionRequest message or plain object
                 * @param callback Node-style callback called with the error, if any, and Session
                 */
                public getSession(request: google.spanner.v1.IGetSessionRequest, callback: google.spanner.v1.Spanner.GetSessionCallback): void;

                /**
                 * Calls GetSession.
                 * @param request GetSessionRequest message or plain object
                 * @returns Promise
                 */
                public getSession(request: google.spanner.v1.IGetSessionRequest): Promise<google.spanner.v1.Session>;

                /**
                 * Calls ListSessions.
                 * @param request ListSessionsRequest message or plain object
                 * @param callback Node-style callback called with the error, if any, and ListSessionsResponse
                 */
                public listSessions(request: google.spanner.v1.IListSessionsRequest, callback: google.spanner.v1.Spanner.ListSessionsCallback): void;

                /**
                 * Calls ListSessions.
                 * @param request ListSessionsRequest message or plain object
                 * @returns Promise
                 */
                public listSessions(request: google.spanner.v1.IListSessionsRequest): Promise<google.spanner.v1.ListSessionsResponse>;

                /**
                 * Calls DeleteSession.
                 * @param request DeleteSessionRequest message or plain object
                 * @param callback Node-style callback called with the error, if any, and Empty
                 */
                public deleteSession(request: google.spanner.v1.IDeleteSessionRequest, callback: google.spanner.v1.Spanner.DeleteSessionCallback): void;

                /**
                 * Calls DeleteSession.
                 * @param request DeleteSessionRequest message or plain object
                 * @returns Promise
                 */
                public deleteSession(request: google.spanner.v1.IDeleteSessionRequest): Promise<google.protobuf.Empty>;

                /**
                 * Calls ExecuteSql.
                 * @param request ExecuteSqlRequest message or plain object
                 * @param callback Node-style callback called with the error, if any, and ResultSet
                 */
                public executeSql(request: google.spanner.v1.IExecuteSqlRequest, callback: google.spanner.v1.Spanner.ExecuteSqlCallback): void;

                /**
                 * Calls ExecuteSql.
                 * @param request ExecuteSqlRequest message or plain object
                 * @returns Promise
                 */
                public executeSql(request: google.spanner.v1.IExecuteSqlRequest): Promise<google.spanner.v1.ResultSet>;

                /**
                 * Calls ExecuteStreamingSql.
                 * @param request ExecuteSqlRequest message or plain object
                 * @param callback Node-style callback called with the error, if any, and PartialResultSet
                 */
                public executeStreamingSql(request: google.spanner.v1.IExecuteSqlRequest, callback: google.spanner.v1.Spanner.ExecuteStreamingSqlCallback): void;

                /**
                 * Calls ExecuteStreamingSql.
                 * @param request ExecuteSqlRequest message or plain object
                 * @returns Promise
                 */
                public executeStreamingSql(request: google.spanner.v1.IExecuteSqlRequest): Promise<google.spanner.v1.PartialResultSet>;

                /**
                 * Calls ExecuteBatchDml.
                 * @param request ExecuteBatchDmlRequest message or plain object
                 * @param callback Node-style callback called with the error, if any, and ExecuteBatchDmlResponse
                 */
                public executeBatchDml(request: google.spanner.v1.IExecuteBatchDmlRequest, callback: google.spanner.v1.Spanner.ExecuteBatchDmlCallback): void;

                /**
                 * Calls ExecuteBatchDml.
                 * @param request ExecuteBatchDmlRequest message or plain object
                 * @returns Promise
                 */
                public executeBatchDml(request: google.spanner.v1.IExecuteBatchDmlRequest): Promise<google.spanner.v1.ExecuteBatchDmlResponse>;

                /**
                 * Calls Read.
                 * @param request ReadRequest message or plain object
                 * @param callback Node-style callback called with the error, if any, and ResultSet
                 */
                public read(request: google.spanner.v1.IReadRequest, callback: google.spanner.v1.Spanner.ReadCallback): void;

                /**
                 * Calls Read.
                 * @param request ReadRequest message or plain object
                 * @returns Promise
                 */
                public read(request: google.spanner.v1.IReadRequest): Promise<google.spanner.v1.ResultSet>;

                /**
                 * Calls StreamingRead.
                 * @param request ReadRequest message or plain object
                 * @param callback Node-style callback called with the error, if any, and PartialResultSet
                 */
                public streamingRead(request: google.spanner.v1.IReadRequest, callback: google.spanner.v1.Spanner.StreamingReadCallback): void;

                /**
                 * Calls StreamingRead.
                 * @param request ReadRequest message or plain object
                 * @returns Promise
                 */
                public streamingRead(request: google.spanner.v1.IReadRequest): Promise<google.spanner.v1.PartialResultSet>;

                /**
                 * Calls BeginTransaction.
                 * @param request BeginTransactionRequest message or plain object
                 * @param callback Node-style callback called with the error, if any, and Transaction
                 */
                public beginTransaction(request: google.spanner.v1.IBeginTransactionRequest, callback: google.spanner.v1.Spanner.BeginTransactionCallback): void;

                /**
                 * Calls BeginTransaction.
                 * @param request BeginTransactionRequest message or plain object
                 * @returns Promise
                 */
                public beginTransaction(request: google.spanner.v1.IBeginTransactionRequest): Promise<google.spanner.v1.Transaction>;

                /**
                 * Calls Commit.
                 * @param request CommitRequest message or plain object
                 * @param callback Node-style callback called with the error, if any, and CommitResponse
                 */
                public commit(request: google.spanner.v1.ICommitRequest, callback: google.spanner.v1.Spanner.CommitCallback): void;

                /**
                 * Calls Commit.
                 * @param request CommitRequest message or plain object
                 * @returns Promise
                 */
                public commit(request: google.spanner.v1.ICommitRequest): Promise<google.spanner.v1.CommitResponse>;

                /**
                 * Calls Rollback.
                 * @param request RollbackRequest message or plain object
                 * @param callback Node-style callback called with the error, if any, and Empty
                 */
                public rollback(request: google.spanner.v1.IRollbackRequest, callback: google.spanner.v1.Spanner.RollbackCallback): void;

                /**
                 * Calls Rollback.
                 * @param request RollbackRequest message or plain object
                 * @returns Promise
                 */
                public rollback(request: google.spanner.v1.IRollbackRequest): Promise<google.protobuf.Empty>;

                /**
                 * Calls PartitionQuery.
                 * @param request PartitionQueryRequest message or plain object
                 * @param callback Node-style callback called with the error, if any, and PartitionResponse
                 */
                public partitionQuery(request: google.spanner.v1.IPartitionQueryRequest, callback: google.spanner.v1.Spanner.PartitionQueryCallback): void;

                /**
                 * Calls PartitionQuery.
                 * @param request PartitionQueryRequest message or plain object
                 * @returns Promise
                 */
                public partitionQuery(request: google.spanner.v1.IPartitionQueryRequest): Promise<google.spanner.v1.PartitionResponse>;

                /**
                 * Calls PartitionRead.
                 * @param request PartitionReadRequest message or plain object
                 * @param callback Node-style callback called with the error, if any, and PartitionResponse
                 */
                public partitionRead(request: google.spanner.v1.IPartitionReadRequest, callback: google.spanner.v1.Spanner.PartitionReadCallback): void;

                /**
                 * Calls PartitionRead.
                 * @param request PartitionReadRequest message or plain object
                 * @returns Promise
                 */
                public partitionRead(request: google.spanner.v1.IPartitionReadRequest): Promise<google.spanner.v1.PartitionResponse>;
            }

            namespace Spanner {

                /**
                 * Callback as used by {@link google.spanner.v1.Spanner#createSession}.
                 * @param error Error, if any
                 * @param [response] Session
                 */
                type CreateSessionCallback = (error: (Error|null), response?: google.spanner.v1.Session) => void;

                /**
                 * Callback as used by {@link google.spanner.v1.Spanner#batchCreateSessions}.
                 * @param error Error, if any
                 * @param [response] BatchCreateSessionsResponse
                 */
                type BatchCreateSessionsCallback = (error: (Error|null), response?: google.spanner.v1.BatchCreateSessionsResponse) => void;

                /**
                 * Callback as used by {@link google.spanner.v1.Spanner#getSession}.
                 * @param error Error, if any
                 * @param [response] Session
                 */
                type GetSessionCallback = (error: (Error|null), response?: google.spanner.v1.Session) => void;

                /**
                 * Callback as used by {@link google.spanner.v1.Spanner#listSessions}.
                 * @param error Error, if any
                 * @param [response] ListSessionsResponse
                 */
                type ListSessionsCallback = (error: (Error|null), response?: google.spanner.v1.ListSessionsResponse) => void;

                /**
                 * Callback as used by {@link google.spanner.v1.Spanner#deleteSession}.
                 * @param error Error, if any
                 * @param [response] Empty
                 */
                type DeleteSessionCallback = (error: (Error|null), response?: google.protobuf.Empty) => void;

                /**
                 * Callback as used by {@link google.spanner.v1.Spanner#executeSql}.
                 * @param error Error, if any
                 * @param [response] ResultSet
                 */
                type ExecuteSqlCallback = (error: (Error|null), response?: google.spanner.v1.ResultSet) => void;

                /**
                 * Callback as used by {@link google.spanner.v1.Spanner#executeStreamingSql}.
                 * @param error Error, if any
                 * @param [response] PartialResultSet
                 */
                type ExecuteStreamingSqlCallback = (error: (Error|null), response?: google.spanner.v1.PartialResultSet) => void;

                /**
                 * Callback as used by {@link google.spanner.v1.Spanner#executeBatchDml}.
                 * @param error Error, if any
                 * @param [response] ExecuteBatchDmlResponse
                 */
                type ExecuteBatchDmlCallback = (error: (Error|null), response?: google.spanner.v1.ExecuteBatchDmlResponse) => void;

                /**
                 * Callback as used by {@link google.spanner.v1.Spanner#read}.
                 * @param error Error, if any
                 * @param [response] ResultSet
                 */
                type ReadCallback = (error: (Error|null), response?: google.spanner.v1.ResultSet) => void;

                /**
                 * Callback as used by {@link google.spanner.v1.Spanner#streamingRead}.
                 * @param error Error, if any
                 * @param [response] PartialResultSet
                 */
                type StreamingReadCallback = (error: (Error|null), response?: google.spanner.v1.PartialResultSet) => void;

                /**
                 * Callback as used by {@link google.spanner.v1.Spanner#beginTransaction}.
                 * @param error Error, if any
                 * @param [response] Transaction
                 */
                type BeginTransactionCallback = (error: (Error|null), response?: google.spanner.v1.Transaction) => void;

                /**
                 * Callback as used by {@link google.spanner.v1.Spanner#commit}.
                 * @param error Error, if any
                 * @param [response] CommitResponse
                 */
                type CommitCallback = (error: (Error|null), response?: google.spanner.v1.CommitResponse) => void;

                /**
                 * Callback as used by {@link google.spanner.v1.Spanner#rollback}.
                 * @param error Error, if any
                 * @param [response] Empty
                 */
                type RollbackCallback = (error: (Error|null), response?: google.protobuf.Empty) => void;

                /**
                 * Callback as used by {@link google.spanner.v1.Spanner#partitionQuery}.
                 * @param error Error, if any
                 * @param [response] PartitionResponse
                 */
                type PartitionQueryCallback = (error: (Error|null), response?: google.spanner.v1.PartitionResponse) => void;

                /**
                 * Callback as used by {@link google.spanner.v1.Spanner#partitionRead}.
                 * @param error Error, if any
                 * @param [response] PartitionResponse
                 */
                type PartitionReadCallback = (error: (Error|null), response?: google.spanner.v1.PartitionResponse) => void;
            }

            /** Properties of a CreateSessionRequest. */
            interface ICreateSessionRequest {

                /** CreateSessionRequest database */
                database?: (string|null);

                /** CreateSessionRequest session */
                session?: (google.spanner.v1.ISession|null);
            }

            /** Represents a CreateSessionRequest. */
            class CreateSessionRequest implements ICreateSessionRequest {

                /**
                 * Constructs a new CreateSessionRequest.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.v1.ICreateSessionRequest);

                /** CreateSessionRequest database. */
                public database: string;

                /** CreateSessionRequest session. */
                public session?: (google.spanner.v1.ISession|null);

                /**
                 * Creates a new CreateSessionRequest instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns CreateSessionRequest instance
                 */
                public static create(properties?: google.spanner.v1.ICreateSessionRequest): google.spanner.v1.CreateSessionRequest;

                /**
                 * Encodes the specified CreateSessionRequest message. Does not implicitly {@link google.spanner.v1.CreateSessionRequest.verify|verify} messages.
                 * @param message CreateSessionRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.v1.ICreateSessionRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified CreateSessionRequest message, length delimited. Does not implicitly {@link google.spanner.v1.CreateSessionRequest.verify|verify} messages.
                 * @param message CreateSessionRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.v1.ICreateSessionRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a CreateSessionRequest message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns CreateSessionRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.v1.CreateSessionRequest;

                /**
                 * Decodes a CreateSessionRequest message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns CreateSessionRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.v1.CreateSessionRequest;

                /**
                 * Verifies a CreateSessionRequest message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a CreateSessionRequest message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns CreateSessionRequest
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.v1.CreateSessionRequest;

                /**
                 * Creates a plain object from a CreateSessionRequest message. Also converts values to other types if specified.
                 * @param message CreateSessionRequest
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.v1.CreateSessionRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this CreateSessionRequest to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a BatchCreateSessionsRequest. */
            interface IBatchCreateSessionsRequest {

                /** BatchCreateSessionsRequest database */
                database?: (string|null);

                /** BatchCreateSessionsRequest sessionTemplate */
                sessionTemplate?: (google.spanner.v1.ISession|null);

                /** BatchCreateSessionsRequest sessionCount */
                sessionCount?: (number|null);
            }

            /** Represents a BatchCreateSessionsRequest. */
            class BatchCreateSessionsRequest implements IBatchCreateSessionsRequest {

                /**
                 * Constructs a new BatchCreateSessionsRequest.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.v1.IBatchCreateSessionsRequest);

                /** BatchCreateSessionsRequest database. */
                public database: string;

                /** BatchCreateSessionsRequest sessionTemplate. */
                public sessionTemplate?: (google.spanner.v1.ISession|null);

                /** BatchCreateSessionsRequest sessionCount. */
                public sessionCount: number;

                /**
                 * Creates a new BatchCreateSessionsRequest instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns BatchCreateSessionsRequest instance
                 */
                public static create(properties?: google.spanner.v1.IBatchCreateSessionsRequest): google.spanner.v1.BatchCreateSessionsRequest;

                /**
                 * Encodes the specified BatchCreateSessionsRequest message. Does not implicitly {@link google.spanner.v1.BatchCreateSessionsRequest.verify|verify} messages.
                 * @param message BatchCreateSessionsRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.v1.IBatchCreateSessionsRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified BatchCreateSessionsRequest message, length delimited. Does not implicitly {@link google.spanner.v1.BatchCreateSessionsRequest.verify|verify} messages.
                 * @param message BatchCreateSessionsRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.v1.IBatchCreateSessionsRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a BatchCreateSessionsRequest message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns BatchCreateSessionsRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.v1.BatchCreateSessionsRequest;

                /**
                 * Decodes a BatchCreateSessionsRequest message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns BatchCreateSessionsRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.v1.BatchCreateSessionsRequest;

                /**
                 * Verifies a BatchCreateSessionsRequest message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a BatchCreateSessionsRequest message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns BatchCreateSessionsRequest
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.v1.BatchCreateSessionsRequest;

                /**
                 * Creates a plain object from a BatchCreateSessionsRequest message. Also converts values to other types if specified.
                 * @param message BatchCreateSessionsRequest
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.v1.BatchCreateSessionsRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this BatchCreateSessionsRequest to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a BatchCreateSessionsResponse. */
            interface IBatchCreateSessionsResponse {

                /** BatchCreateSessionsResponse session */
                session?: (google.spanner.v1.ISession[]|null);
            }

            /** Represents a BatchCreateSessionsResponse. */
            class BatchCreateSessionsResponse implements IBatchCreateSessionsResponse {

                /**
                 * Constructs a new BatchCreateSessionsResponse.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.v1.IBatchCreateSessionsResponse);

                /** BatchCreateSessionsResponse session. */
                public session: google.spanner.v1.ISession[];

                /**
                 * Creates a new BatchCreateSessionsResponse instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns BatchCreateSessionsResponse instance
                 */
                public static create(properties?: google.spanner.v1.IBatchCreateSessionsResponse): google.spanner.v1.BatchCreateSessionsResponse;

                /**
                 * Encodes the specified BatchCreateSessionsResponse message. Does not implicitly {@link google.spanner.v1.BatchCreateSessionsResponse.verify|verify} messages.
                 * @param message BatchCreateSessionsResponse message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.v1.IBatchCreateSessionsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified BatchCreateSessionsResponse message, length delimited. Does not implicitly {@link google.spanner.v1.BatchCreateSessionsResponse.verify|verify} messages.
                 * @param message BatchCreateSessionsResponse message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.v1.IBatchCreateSessionsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a BatchCreateSessionsResponse message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns BatchCreateSessionsResponse
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.v1.BatchCreateSessionsResponse;

                /**
                 * Decodes a BatchCreateSessionsResponse message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns BatchCreateSessionsResponse
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.v1.BatchCreateSessionsResponse;

                /**
                 * Verifies a BatchCreateSessionsResponse message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a BatchCreateSessionsResponse message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns BatchCreateSessionsResponse
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.v1.BatchCreateSessionsResponse;

                /**
                 * Creates a plain object from a BatchCreateSessionsResponse message. Also converts values to other types if specified.
                 * @param message BatchCreateSessionsResponse
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.v1.BatchCreateSessionsResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this BatchCreateSessionsResponse to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a Session. */
            interface ISession {

                /** Session name */
                name?: (string|null);

                /** Session labels */
                labels?: ({ [k: string]: string }|null);

                /** Session createTime */
                createTime?: (google.protobuf.ITimestamp|null);

                /** Session approximateLastUseTime */
                approximateLastUseTime?: (google.protobuf.ITimestamp|null);

                /** Session creatorRole */
                creatorRole?: (string|null);
            }

            /** Represents a Session. */
            class Session implements ISession {

                /**
                 * Constructs a new Session.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.v1.ISession);

                /** Session name. */
                public name: string;

                /** Session labels. */
                public labels: { [k: string]: string };

                /** Session createTime. */
                public createTime?: (google.protobuf.ITimestamp|null);

                /** Session approximateLastUseTime. */
                public approximateLastUseTime?: (google.protobuf.ITimestamp|null);

                /** Session creatorRole. */
                public creatorRole: string;

                /**
                 * Creates a new Session instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns Session instance
                 */
                public static create(properties?: google.spanner.v1.ISession): google.spanner.v1.Session;

                /**
                 * Encodes the specified Session message. Does not implicitly {@link google.spanner.v1.Session.verify|verify} messages.
                 * @param message Session message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.v1.ISession, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified Session message, length delimited. Does not implicitly {@link google.spanner.v1.Session.verify|verify} messages.
                 * @param message Session message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.v1.ISession, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a Session message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns Session
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.v1.Session;

                /**
                 * Decodes a Session message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns Session
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.v1.Session;

                /**
                 * Verifies a Session message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a Session message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns Session
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.v1.Session;

                /**
                 * Creates a plain object from a Session message. Also converts values to other types if specified.
                 * @param message Session
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.v1.Session, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this Session to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a GetSessionRequest. */
            interface IGetSessionRequest {

                /** GetSessionRequest name */
                name?: (string|null);
            }

            /** Represents a GetSessionRequest. */
            class GetSessionRequest implements IGetSessionRequest {

                /**
                 * Constructs a new GetSessionRequest.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.v1.IGetSessionRequest);

                /** GetSessionRequest name. */
                public name: string;

                /**
                 * Creates a new GetSessionRequest instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns GetSessionRequest instance
                 */
                public static create(properties?: google.spanner.v1.IGetSessionRequest): google.spanner.v1.GetSessionRequest;

                /**
                 * Encodes the specified GetSessionRequest message. Does not implicitly {@link google.spanner.v1.GetSessionRequest.verify|verify} messages.
                 * @param message GetSessionRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.v1.IGetSessionRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified GetSessionRequest message, length delimited. Does not implicitly {@link google.spanner.v1.GetSessionRequest.verify|verify} messages.
                 * @param message GetSessionRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.v1.IGetSessionRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a GetSessionRequest message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns GetSessionRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.v1.GetSessionRequest;

                /**
                 * Decodes a GetSessionRequest message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns GetSessionRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.v1.GetSessionRequest;

                /**
                 * Verifies a GetSessionRequest message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a GetSessionRequest message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns GetSessionRequest
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.v1.GetSessionRequest;

                /**
                 * Creates a plain object from a GetSessionRequest message. Also converts values to other types if specified.
                 * @param message GetSessionRequest
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.v1.GetSessionRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this GetSessionRequest to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a ListSessionsRequest. */
            interface IListSessionsRequest {

                /** ListSessionsRequest database */
                database?: (string|null);

                /** ListSessionsRequest pageSize */
                pageSize?: (number|null);

                /** ListSessionsRequest pageToken */
                pageToken?: (string|null);

                /** ListSessionsRequest filter */
                filter?: (string|null);
            }

            /** Represents a ListSessionsRequest. */
            class ListSessionsRequest implements IListSessionsRequest {

                /**
                 * Constructs a new ListSessionsRequest.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.v1.IListSessionsRequest);

                /** ListSessionsRequest database. */
                public database: string;

                /** ListSessionsRequest pageSize. */
                public pageSize: number;

                /** ListSessionsRequest pageToken. */
                public pageToken: string;

                /** ListSessionsRequest filter. */
                public filter: string;

                /**
                 * Creates a new ListSessionsRequest instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns ListSessionsRequest instance
                 */
                public static create(properties?: google.spanner.v1.IListSessionsRequest): google.spanner.v1.ListSessionsRequest;

                /**
                 * Encodes the specified ListSessionsRequest message. Does not implicitly {@link google.spanner.v1.ListSessionsRequest.verify|verify} messages.
                 * @param message ListSessionsRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.v1.IListSessionsRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified ListSessionsRequest message, length delimited. Does not implicitly {@link google.spanner.v1.ListSessionsRequest.verify|verify} messages.
                 * @param message ListSessionsRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.v1.IListSessionsRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a ListSessionsRequest message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns ListSessionsRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.v1.ListSessionsRequest;

                /**
                 * Decodes a ListSessionsRequest message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns ListSessionsRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.v1.ListSessionsRequest;

                /**
                 * Verifies a ListSessionsRequest message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a ListSessionsRequest message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns ListSessionsRequest
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.v1.ListSessionsRequest;

                /**
                 * Creates a plain object from a ListSessionsRequest message. Also converts values to other types if specified.
                 * @param message ListSessionsRequest
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.v1.ListSessionsRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this ListSessionsRequest to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a ListSessionsResponse. */
            interface IListSessionsResponse {

                /** ListSessionsResponse sessions */
                sessions?: (google.spanner.v1.ISession[]|null);

                /** ListSessionsResponse nextPageToken */
                nextPageToken?: (string|null);
            }

            /** Represents a ListSessionsResponse. */
            class ListSessionsResponse implements IListSessionsResponse {

                /**
                 * Constructs a new ListSessionsResponse.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.v1.IListSessionsResponse);

                /** ListSessionsResponse sessions. */
                public sessions: google.spanner.v1.ISession[];

                /** ListSessionsResponse nextPageToken. */
                public nextPageToken: string;

                /**
                 * Creates a new ListSessionsResponse instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns ListSessionsResponse instance
                 */
                public static create(properties?: google.spanner.v1.IListSessionsResponse): google.spanner.v1.ListSessionsResponse;

                /**
                 * Encodes the specified ListSessionsResponse message. Does not implicitly {@link google.spanner.v1.ListSessionsResponse.verify|verify} messages.
                 * @param message ListSessionsResponse message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.v1.IListSessionsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified ListSessionsResponse message, length delimited. Does not implicitly {@link google.spanner.v1.ListSessionsResponse.verify|verify} messages.
                 * @param message ListSessionsResponse message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.v1.IListSessionsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a ListSessionsResponse message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns ListSessionsResponse
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.v1.ListSessionsResponse;

                /**
                 * Decodes a ListSessionsResponse message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns ListSessionsResponse
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.v1.ListSessionsResponse;

                /**
                 * Verifies a ListSessionsResponse message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a ListSessionsResponse message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns ListSessionsResponse
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.v1.ListSessionsResponse;

                /**
                 * Creates a plain object from a ListSessionsResponse message. Also converts values to other types if specified.
                 * @param message ListSessionsResponse
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.v1.ListSessionsResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this ListSessionsResponse to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a DeleteSessionRequest. */
            interface IDeleteSessionRequest {

                /** DeleteSessionRequest name */
                name?: (string|null);
            }

            /** Represents a DeleteSessionRequest. */
            class DeleteSessionRequest implements IDeleteSessionRequest {

                /**
                 * Constructs a new DeleteSessionRequest.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.v1.IDeleteSessionRequest);

                /** DeleteSessionRequest name. */
                public name: string;

                /**
                 * Creates a new DeleteSessionRequest instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns DeleteSessionRequest instance
                 */
                public static create(properties?: google.spanner.v1.IDeleteSessionRequest): google.spanner.v1.DeleteSessionRequest;

                /**
                 * Encodes the specified DeleteSessionRequest message. Does not implicitly {@link google.spanner.v1.DeleteSessionRequest.verify|verify} messages.
                 * @param message DeleteSessionRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.v1.IDeleteSessionRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified DeleteSessionRequest message, length delimited. Does not implicitly {@link google.spanner.v1.DeleteSessionRequest.verify|verify} messages.
                 * @param message DeleteSessionRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.v1.IDeleteSessionRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a DeleteSessionRequest message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns DeleteSessionRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.v1.DeleteSessionRequest;

                /**
                 * Decodes a DeleteSessionRequest message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns DeleteSessionRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.v1.DeleteSessionRequest;

                /**
                 * Verifies a DeleteSessionRequest message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a DeleteSessionRequest message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns DeleteSessionRequest
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.v1.DeleteSessionRequest;

                /**
                 * Creates a plain object from a DeleteSessionRequest message. Also converts values to other types if specified.
                 * @param message DeleteSessionRequest
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.v1.DeleteSessionRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this DeleteSessionRequest to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a RequestOptions. */
            interface IRequestOptions {

                /** RequestOptions priority */
                priority?: (google.spanner.v1.RequestOptions.Priority|keyof typeof google.spanner.v1.RequestOptions.Priority|null);

                /** RequestOptions requestTag */
                requestTag?: (string|null);

                /** RequestOptions transactionTag */
                transactionTag?: (string|null);
            }

            /** Represents a RequestOptions. */
            class RequestOptions implements IRequestOptions {

                /**
                 * Constructs a new RequestOptions.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.v1.IRequestOptions);

                /** RequestOptions priority. */
                public priority: (google.spanner.v1.RequestOptions.Priority|keyof typeof google.spanner.v1.RequestOptions.Priority);

                /** RequestOptions requestTag. */
                public requestTag: string;

                /** RequestOptions transactionTag. */
                public transactionTag: string;

                /**
                 * Creates a new RequestOptions instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns RequestOptions instance
                 */
                public static create(properties?: google.spanner.v1.IRequestOptions): google.spanner.v1.RequestOptions;

                /**
                 * Encodes the specified RequestOptions message. Does not implicitly {@link google.spanner.v1.RequestOptions.verify|verify} messages.
                 * @param message RequestOptions message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.v1.IRequestOptions, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified RequestOptions message, length delimited. Does not implicitly {@link google.spanner.v1.RequestOptions.verify|verify} messages.
                 * @param message RequestOptions message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.v1.IRequestOptions, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a RequestOptions message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns RequestOptions
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.v1.RequestOptions;

                /**
                 * Decodes a RequestOptions message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns RequestOptions
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.v1.RequestOptions;

                /**
                 * Verifies a RequestOptions message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a RequestOptions message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns RequestOptions
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.v1.RequestOptions;

                /**
                 * Creates a plain object from a RequestOptions message. Also converts values to other types if specified.
                 * @param message RequestOptions
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.v1.RequestOptions, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this RequestOptions to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            namespace RequestOptions {

                /** Priority enum. */
                enum Priority {
                    PRIORITY_UNSPECIFIED = 0,
                    PRIORITY_LOW = 1,
                    PRIORITY_MEDIUM = 2,
                    PRIORITY_HIGH = 3
                }
            }

            /** Properties of an ExecuteSqlRequest. */
            interface IExecuteSqlRequest {

                /** ExecuteSqlRequest session */
                session?: (string|null);

                /** ExecuteSqlRequest transaction */
                transaction?: (google.spanner.v1.ITransactionSelector|null);

                /** ExecuteSqlRequest sql */
                sql?: (string|null);

                /** ExecuteSqlRequest params */
                params?: (google.protobuf.IStruct|null);

                /** ExecuteSqlRequest paramTypes */
                paramTypes?: ({ [k: string]: google.spanner.v1.IType }|null);

                /** ExecuteSqlRequest resumeToken */
                resumeToken?: (Uint8Array|string|null);

                /** ExecuteSqlRequest queryMode */
                queryMode?: (google.spanner.v1.ExecuteSqlRequest.QueryMode|keyof typeof google.spanner.v1.ExecuteSqlRequest.QueryMode|null);

                /** ExecuteSqlRequest partitionToken */
                partitionToken?: (Uint8Array|string|null);

                /** ExecuteSqlRequest seqno */
                seqno?: (number|Long|string|null);

                /** ExecuteSqlRequest queryOptions */
                queryOptions?: (google.spanner.v1.ExecuteSqlRequest.IQueryOptions|null);

                /** ExecuteSqlRequest requestOptions */
                requestOptions?: (google.spanner.v1.IRequestOptions|null);
            }

            /** Represents an ExecuteSqlRequest. */
            class ExecuteSqlRequest implements IExecuteSqlRequest {

                /**
                 * Constructs a new ExecuteSqlRequest.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.v1.IExecuteSqlRequest);

                /** ExecuteSqlRequest session. */
                public session: string;

                /** ExecuteSqlRequest transaction. */
                public transaction?: (google.spanner.v1.ITransactionSelector|null);

                /** ExecuteSqlRequest sql. */
                public sql: string;

                /** ExecuteSqlRequest params. */
                public params?: (google.protobuf.IStruct|null);

                /** ExecuteSqlRequest paramTypes. */
                public paramTypes: { [k: string]: google.spanner.v1.IType };

                /** ExecuteSqlRequest resumeToken. */
                public resumeToken: (Uint8Array|string);

                /** ExecuteSqlRequest queryMode. */
                public queryMode: (google.spanner.v1.ExecuteSqlRequest.QueryMode|keyof typeof google.spanner.v1.ExecuteSqlRequest.QueryMode);

                /** ExecuteSqlRequest partitionToken. */
                public partitionToken: (Uint8Array|string);

                /** ExecuteSqlRequest seqno. */
                public seqno: (number|Long|string);

                /** ExecuteSqlRequest queryOptions. */
                public queryOptions?: (google.spanner.v1.ExecuteSqlRequest.IQueryOptions|null);

                /** ExecuteSqlRequest requestOptions. */
                public requestOptions?: (google.spanner.v1.IRequestOptions|null);

                /**
                 * Creates a new ExecuteSqlRequest instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns ExecuteSqlRequest instance
                 */
                public static create(properties?: google.spanner.v1.IExecuteSqlRequest): google.spanner.v1.ExecuteSqlRequest;

                /**
                 * Encodes the specified ExecuteSqlRequest message. Does not implicitly {@link google.spanner.v1.ExecuteSqlRequest.verify|verify} messages.
                 * @param message ExecuteSqlRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.v1.IExecuteSqlRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified ExecuteSqlRequest message, length delimited. Does not implicitly {@link google.spanner.v1.ExecuteSqlRequest.verify|verify} messages.
                 * @param message ExecuteSqlRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.v1.IExecuteSqlRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes an ExecuteSqlRequest message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns ExecuteSqlRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.v1.ExecuteSqlRequest;

                /**
                 * Decodes an ExecuteSqlRequest message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns ExecuteSqlRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.v1.ExecuteSqlRequest;

                /**
                 * Verifies an ExecuteSqlRequest message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates an ExecuteSqlRequest message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns ExecuteSqlRequest
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.v1.ExecuteSqlRequest;

                /**
                 * Creates a plain object from an ExecuteSqlRequest message. Also converts values to other types if specified.
                 * @param message ExecuteSqlRequest
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.v1.ExecuteSqlRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this ExecuteSqlRequest to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            namespace ExecuteSqlRequest {

                /** QueryMode enum. */
                enum QueryMode {
                    NORMAL = 0,
                    PLAN = 1,
                    PROFILE = 2
                }

                /** Properties of a QueryOptions. */
                interface IQueryOptions {

                    /** QueryOptions optimizerVersion */
                    optimizerVersion?: (string|null);

                    /** QueryOptions optimizerStatisticsPackage */
                    optimizerStatisticsPackage?: (string|null);
                }

                /** Represents a QueryOptions. */
                class QueryOptions implements IQueryOptions {

                    /**
                     * Constructs a new QueryOptions.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: google.spanner.v1.ExecuteSqlRequest.IQueryOptions);

                    /** QueryOptions optimizerVersion. */
                    public optimizerVersion: string;

                    /** QueryOptions optimizerStatisticsPackage. */
                    public optimizerStatisticsPackage: string;

                    /**
                     * Creates a new QueryOptions instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns QueryOptions instance
                     */
                    public static create(properties?: google.spanner.v1.ExecuteSqlRequest.IQueryOptions): google.spanner.v1.ExecuteSqlRequest.QueryOptions;

                    /**
                     * Encodes the specified QueryOptions message. Does not implicitly {@link google.spanner.v1.ExecuteSqlRequest.QueryOptions.verify|verify} messages.
                     * @param message QueryOptions message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: google.spanner.v1.ExecuteSqlRequest.IQueryOptions, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified QueryOptions message, length delimited. Does not implicitly {@link google.spanner.v1.ExecuteSqlRequest.QueryOptions.verify|verify} messages.
                     * @param message QueryOptions message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: google.spanner.v1.ExecuteSqlRequest.IQueryOptions, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a QueryOptions message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns QueryOptions
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.v1.ExecuteSqlRequest.QueryOptions;

                    /**
                     * Decodes a QueryOptions message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns QueryOptions
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.v1.ExecuteSqlRequest.QueryOptions;

                    /**
                     * Verifies a QueryOptions message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a QueryOptions message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns QueryOptions
                     */
                    public static fromObject(object: { [k: string]: any }): google.spanner.v1.ExecuteSqlRequest.QueryOptions;

                    /**
                     * Creates a plain object from a QueryOptions message. Also converts values to other types if specified.
                     * @param message QueryOptions
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: google.spanner.v1.ExecuteSqlRequest.QueryOptions, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this QueryOptions to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };
                }
            }

            /** Properties of an ExecuteBatchDmlRequest. */
            interface IExecuteBatchDmlRequest {

                /** ExecuteBatchDmlRequest session */
                session?: (string|null);

                /** ExecuteBatchDmlRequest transaction */
                transaction?: (google.spanner.v1.ITransactionSelector|null);

                /** ExecuteBatchDmlRequest statements */
                statements?: (google.spanner.v1.ExecuteBatchDmlRequest.IStatement[]|null);

                /** ExecuteBatchDmlRequest seqno */
                seqno?: (number|Long|string|null);

                /** ExecuteBatchDmlRequest requestOptions */
                requestOptions?: (google.spanner.v1.IRequestOptions|null);
            }

            /** Represents an ExecuteBatchDmlRequest. */
            class ExecuteBatchDmlRequest implements IExecuteBatchDmlRequest {

                /**
                 * Constructs a new ExecuteBatchDmlRequest.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.v1.IExecuteBatchDmlRequest);

                /** ExecuteBatchDmlRequest session. */
                public session: string;

                /** ExecuteBatchDmlRequest transaction. */
                public transaction?: (google.spanner.v1.ITransactionSelector|null);

                /** ExecuteBatchDmlRequest statements. */
                public statements: google.spanner.v1.ExecuteBatchDmlRequest.IStatement[];

                /** ExecuteBatchDmlRequest seqno. */
                public seqno: (number|Long|string);

                /** ExecuteBatchDmlRequest requestOptions. */
                public requestOptions?: (google.spanner.v1.IRequestOptions|null);

                /**
                 * Creates a new ExecuteBatchDmlRequest instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns ExecuteBatchDmlRequest instance
                 */
                public static create(properties?: google.spanner.v1.IExecuteBatchDmlRequest): google.spanner.v1.ExecuteBatchDmlRequest;

                /**
                 * Encodes the specified ExecuteBatchDmlRequest message. Does not implicitly {@link google.spanner.v1.ExecuteBatchDmlRequest.verify|verify} messages.
                 * @param message ExecuteBatchDmlRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.v1.IExecuteBatchDmlRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified ExecuteBatchDmlRequest message, length delimited. Does not implicitly {@link google.spanner.v1.ExecuteBatchDmlRequest.verify|verify} messages.
                 * @param message ExecuteBatchDmlRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.v1.IExecuteBatchDmlRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes an ExecuteBatchDmlRequest message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns ExecuteBatchDmlRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.v1.ExecuteBatchDmlRequest;

                /**
                 * Decodes an ExecuteBatchDmlRequest message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns ExecuteBatchDmlRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.v1.ExecuteBatchDmlRequest;

                /**
                 * Verifies an ExecuteBatchDmlRequest message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates an ExecuteBatchDmlRequest message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns ExecuteBatchDmlRequest
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.v1.ExecuteBatchDmlRequest;

                /**
                 * Creates a plain object from an ExecuteBatchDmlRequest message. Also converts values to other types if specified.
                 * @param message ExecuteBatchDmlRequest
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.v1.ExecuteBatchDmlRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this ExecuteBatchDmlRequest to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            namespace ExecuteBatchDmlRequest {

                /** Properties of a Statement. */
                interface IStatement {

                    /** Statement sql */
                    sql?: (string|null);

                    /** Statement params */
                    params?: (google.protobuf.IStruct|null);

                    /** Statement paramTypes */
                    paramTypes?: ({ [k: string]: google.spanner.v1.IType }|null);
                }

                /** Represents a Statement. */
                class Statement implements IStatement {

                    /**
                     * Constructs a new Statement.
                     * @param [properties] Properties to set
                     */
                    constructor(properties?: google.spanner.v1.ExecuteBatchDmlRequest.IStatement);

                    /** Statement sql. */
                    public sql: string;

                    /** Statement params. */
                    public params?: (google.protobuf.IStruct|null);

                    /** Statement paramTypes. */
                    public paramTypes: { [k: string]: google.spanner.v1.IType };

                    /**
                     * Creates a new Statement instance using the specified properties.
                     * @param [properties] Properties to set
                     * @returns Statement instance
                     */
                    public static create(properties?: google.spanner.v1.ExecuteBatchDmlRequest.IStatement): google.spanner.v1.ExecuteBatchDmlRequest.Statement;

                    /**
                     * Encodes the specified Statement message. Does not implicitly {@link google.spanner.v1.ExecuteBatchDmlRequest.Statement.verify|verify} messages.
                     * @param message Statement message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encode(message: google.spanner.v1.ExecuteBatchDmlRequest.IStatement, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Encodes the specified Statement message, length delimited. Does not implicitly {@link google.spanner.v1.ExecuteBatchDmlRequest.Statement.verify|verify} messages.
                     * @param message Statement message or plain object to encode
                     * @param [writer] Writer to encode to
                     * @returns Writer
                     */
                    public static encodeDelimited(message: google.spanner.v1.ExecuteBatchDmlRequest.IStatement, writer?: $protobuf.Writer): $protobuf.Writer;

                    /**
                     * Decodes a Statement message from the specified reader or buffer.
                     * @param reader Reader or buffer to decode from
                     * @param [length] Message length if known beforehand
                     * @returns Statement
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.v1.ExecuteBatchDmlRequest.Statement;

                    /**
                     * Decodes a Statement message from the specified reader or buffer, length delimited.
                     * @param reader Reader or buffer to decode from
                     * @returns Statement
                     * @throws {Error} If the payload is not a reader or valid buffer
                     * @throws {$protobuf.util.ProtocolError} If required fields are missing
                     */
                    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.v1.ExecuteBatchDmlRequest.Statement;

                    /**
                     * Verifies a Statement message.
                     * @param message Plain object to verify
                     * @returns `null` if valid, otherwise the reason why it is not
                     */
                    public static verify(message: { [k: string]: any }): (string|null);

                    /**
                     * Creates a Statement message from a plain object. Also converts values to their respective internal types.
                     * @param object Plain object
                     * @returns Statement
                     */
                    public static fromObject(object: { [k: string]: any }): google.spanner.v1.ExecuteBatchDmlRequest.Statement;

                    /**
                     * Creates a plain object from a Statement message. Also converts values to other types if specified.
                     * @param message Statement
                     * @param [options] Conversion options
                     * @returns Plain object
                     */
                    public static toObject(message: google.spanner.v1.ExecuteBatchDmlRequest.Statement, options?: $protobuf.IConversionOptions): { [k: string]: any };

                    /**
                     * Converts this Statement to JSON.
                     * @returns JSON object
                     */
                    public toJSON(): { [k: string]: any };
                }
            }

            /** Properties of an ExecuteBatchDmlResponse. */
            interface IExecuteBatchDmlResponse {

                /** ExecuteBatchDmlResponse resultSets */
                resultSets?: (google.spanner.v1.IResultSet[]|null);

                /** ExecuteBatchDmlResponse status */
                status?: (google.rpc.IStatus|null);
            }

            /** Represents an ExecuteBatchDmlResponse. */
            class ExecuteBatchDmlResponse implements IExecuteBatchDmlResponse {

                /**
                 * Constructs a new ExecuteBatchDmlResponse.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.v1.IExecuteBatchDmlResponse);

                /** ExecuteBatchDmlResponse resultSets. */
                public resultSets: google.spanner.v1.IResultSet[];

                /** ExecuteBatchDmlResponse status. */
                public status?: (google.rpc.IStatus|null);

                /**
                 * Creates a new ExecuteBatchDmlResponse instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns ExecuteBatchDmlResponse instance
                 */
                public static create(properties?: google.spanner.v1.IExecuteBatchDmlResponse): google.spanner.v1.ExecuteBatchDmlResponse;

                /**
                 * Encodes the specified ExecuteBatchDmlResponse message. Does not implicitly {@link google.spanner.v1.ExecuteBatchDmlResponse.verify|verify} messages.
                 * @param message ExecuteBatchDmlResponse message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.v1.IExecuteBatchDmlResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified ExecuteBatchDmlResponse message, length delimited. Does not implicitly {@link google.spanner.v1.ExecuteBatchDmlResponse.verify|verify} messages.
                 * @param message ExecuteBatchDmlResponse message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.v1.IExecuteBatchDmlResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes an ExecuteBatchDmlResponse message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns ExecuteBatchDmlResponse
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.v1.ExecuteBatchDmlResponse;

                /**
                 * Decodes an ExecuteBatchDmlResponse message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns ExecuteBatchDmlResponse
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.v1.ExecuteBatchDmlResponse;

                /**
                 * Verifies an ExecuteBatchDmlResponse message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates an ExecuteBatchDmlResponse message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns ExecuteBatchDmlResponse
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.v1.ExecuteBatchDmlResponse;

                /**
                 * Creates a plain object from an ExecuteBatchDmlResponse message. Also converts values to other types if specified.
                 * @param message ExecuteBatchDmlResponse
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.v1.ExecuteBatchDmlResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this ExecuteBatchDmlResponse to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a PartitionOptions. */
            interface IPartitionOptions {

                /** PartitionOptions partitionSizeBytes */
                partitionSizeBytes?: (number|Long|string|null);

                /** PartitionOptions maxPartitions */
                maxPartitions?: (number|Long|string|null);
            }

            /** Represents a PartitionOptions. */
            class PartitionOptions implements IPartitionOptions {

                /**
                 * Constructs a new PartitionOptions.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.v1.IPartitionOptions);

                /** PartitionOptions partitionSizeBytes. */
                public partitionSizeBytes: (number|Long|string);

                /** PartitionOptions maxPartitions. */
                public maxPartitions: (number|Long|string);

                /**
                 * Creates a new PartitionOptions instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns PartitionOptions instance
                 */
                public static create(properties?: google.spanner.v1.IPartitionOptions): google.spanner.v1.PartitionOptions;

                /**
                 * Encodes the specified PartitionOptions message. Does not implicitly {@link google.spanner.v1.PartitionOptions.verify|verify} messages.
                 * @param message PartitionOptions message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.v1.IPartitionOptions, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified PartitionOptions message, length delimited. Does not implicitly {@link google.spanner.v1.PartitionOptions.verify|verify} messages.
                 * @param message PartitionOptions message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.v1.IPartitionOptions, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a PartitionOptions message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns PartitionOptions
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.v1.PartitionOptions;

                /**
                 * Decodes a PartitionOptions message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns PartitionOptions
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.v1.PartitionOptions;

                /**
                 * Verifies a PartitionOptions message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a PartitionOptions message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns PartitionOptions
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.v1.PartitionOptions;

                /**
                 * Creates a plain object from a PartitionOptions message. Also converts values to other types if specified.
                 * @param message PartitionOptions
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.v1.PartitionOptions, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this PartitionOptions to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a PartitionQueryRequest. */
            interface IPartitionQueryRequest {

                /** PartitionQueryRequest session */
                session?: (string|null);

                /** PartitionQueryRequest transaction */
                transaction?: (google.spanner.v1.ITransactionSelector|null);

                /** PartitionQueryRequest sql */
                sql?: (string|null);

                /** PartitionQueryRequest params */
                params?: (google.protobuf.IStruct|null);

                /** PartitionQueryRequest paramTypes */
                paramTypes?: ({ [k: string]: google.spanner.v1.IType }|null);

                /** PartitionQueryRequest partitionOptions */
                partitionOptions?: (google.spanner.v1.IPartitionOptions|null);
            }

            /** Represents a PartitionQueryRequest. */
            class PartitionQueryRequest implements IPartitionQueryRequest {

                /**
                 * Constructs a new PartitionQueryRequest.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.v1.IPartitionQueryRequest);

                /** PartitionQueryRequest session. */
                public session: string;

                /** PartitionQueryRequest transaction. */
                public transaction?: (google.spanner.v1.ITransactionSelector|null);

                /** PartitionQueryRequest sql. */
                public sql: string;

                /** PartitionQueryRequest params. */
                public params?: (google.protobuf.IStruct|null);

                /** PartitionQueryRequest paramTypes. */
                public paramTypes: { [k: string]: google.spanner.v1.IType };

                /** PartitionQueryRequest partitionOptions. */
                public partitionOptions?: (google.spanner.v1.IPartitionOptions|null);

                /**
                 * Creates a new PartitionQueryRequest instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns PartitionQueryRequest instance
                 */
                public static create(properties?: google.spanner.v1.IPartitionQueryRequest): google.spanner.v1.PartitionQueryRequest;

                /**
                 * Encodes the specified PartitionQueryRequest message. Does not implicitly {@link google.spanner.v1.PartitionQueryRequest.verify|verify} messages.
                 * @param message PartitionQueryRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.v1.IPartitionQueryRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified PartitionQueryRequest message, length delimited. Does not implicitly {@link google.spanner.v1.PartitionQueryRequest.verify|verify} messages.
                 * @param message PartitionQueryRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.v1.IPartitionQueryRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a PartitionQueryRequest message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns PartitionQueryRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.v1.PartitionQueryRequest;

                /**
                 * Decodes a PartitionQueryRequest message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns PartitionQueryRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.v1.PartitionQueryRequest;

                /**
                 * Verifies a PartitionQueryRequest message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a PartitionQueryRequest message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns PartitionQueryRequest
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.v1.PartitionQueryRequest;

                /**
                 * Creates a plain object from a PartitionQueryRequest message. Also converts values to other types if specified.
                 * @param message PartitionQueryRequest
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.v1.PartitionQueryRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this PartitionQueryRequest to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a PartitionReadRequest. */
            interface IPartitionReadRequest {

                /** PartitionReadRequest session */
                session?: (string|null);

                /** PartitionReadRequest transaction */
                transaction?: (google.spanner.v1.ITransactionSelector|null);

                /** PartitionReadRequest table */
                table?: (string|null);

                /** PartitionReadRequest index */
                index?: (string|null);

                /** PartitionReadRequest columns */
                columns?: (string[]|null);

                /** PartitionReadRequest keySet */
                keySet?: (google.spanner.v1.IKeySet|null);

                /** PartitionReadRequest partitionOptions */
                partitionOptions?: (google.spanner.v1.IPartitionOptions|null);
            }

            /** Represents a PartitionReadRequest. */
            class PartitionReadRequest implements IPartitionReadRequest {

                /**
                 * Constructs a new PartitionReadRequest.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.v1.IPartitionReadRequest);

                /** PartitionReadRequest session. */
                public session: string;

                /** PartitionReadRequest transaction. */
                public transaction?: (google.spanner.v1.ITransactionSelector|null);

                /** PartitionReadRequest table. */
                public table: string;

                /** PartitionReadRequest index. */
                public index: string;

                /** PartitionReadRequest columns. */
                public columns: string[];

                /** PartitionReadRequest keySet. */
                public keySet?: (google.spanner.v1.IKeySet|null);

                /** PartitionReadRequest partitionOptions. */
                public partitionOptions?: (google.spanner.v1.IPartitionOptions|null);

                /**
                 * Creates a new PartitionReadRequest instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns PartitionReadRequest instance
                 */
                public static create(properties?: google.spanner.v1.IPartitionReadRequest): google.spanner.v1.PartitionReadRequest;

                /**
                 * Encodes the specified PartitionReadRequest message. Does not implicitly {@link google.spanner.v1.PartitionReadRequest.verify|verify} messages.
                 * @param message PartitionReadRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.v1.IPartitionReadRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified PartitionReadRequest message, length delimited. Does not implicitly {@link google.spanner.v1.PartitionReadRequest.verify|verify} messages.
                 * @param message PartitionReadRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.v1.IPartitionReadRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a PartitionReadRequest message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns PartitionReadRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.v1.PartitionReadRequest;

                /**
                 * Decodes a PartitionReadRequest message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns PartitionReadRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.v1.PartitionReadRequest;

                /**
                 * Verifies a PartitionReadRequest message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a PartitionReadRequest message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns PartitionReadRequest
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.v1.PartitionReadRequest;

                /**
                 * Creates a plain object from a PartitionReadRequest message. Also converts values to other types if specified.
                 * @param message PartitionReadRequest
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.v1.PartitionReadRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this PartitionReadRequest to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a Partition. */
            interface IPartition {

                /** Partition partitionToken */
                partitionToken?: (Uint8Array|string|null);
            }

            /** Represents a Partition. */
            class Partition implements IPartition {

                /**
                 * Constructs a new Partition.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.v1.IPartition);

                /** Partition partitionToken. */
                public partitionToken: (Uint8Array|string);

                /**
                 * Creates a new Partition instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns Partition instance
                 */
                public static create(properties?: google.spanner.v1.IPartition): google.spanner.v1.Partition;

                /**
                 * Encodes the specified Partition message. Does not implicitly {@link google.spanner.v1.Partition.verify|verify} messages.
                 * @param message Partition message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.v1.IPartition, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified Partition message, length delimited. Does not implicitly {@link google.spanner.v1.Partition.verify|verify} messages.
                 * @param message Partition message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.v1.IPartition, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a Partition message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns Partition
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.v1.Partition;

                /**
                 * Decodes a Partition message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns Partition
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.v1.Partition;

                /**
                 * Verifies a Partition message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a Partition message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns Partition
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.v1.Partition;

                /**
                 * Creates a plain object from a Partition message. Also converts values to other types if specified.
                 * @param message Partition
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.v1.Partition, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this Partition to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a PartitionResponse. */
            interface IPartitionResponse {

                /** PartitionResponse partitions */
                partitions?: (google.spanner.v1.IPartition[]|null);

                /** PartitionResponse transaction */
                transaction?: (google.spanner.v1.ITransaction|null);
            }

            /** Represents a PartitionResponse. */
            class PartitionResponse implements IPartitionResponse {

                /**
                 * Constructs a new PartitionResponse.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.v1.IPartitionResponse);

                /** PartitionResponse partitions. */
                public partitions: google.spanner.v1.IPartition[];

                /** PartitionResponse transaction. */
                public transaction?: (google.spanner.v1.ITransaction|null);

                /**
                 * Creates a new PartitionResponse instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns PartitionResponse instance
                 */
                public static create(properties?: google.spanner.v1.IPartitionResponse): google.spanner.v1.PartitionResponse;

                /**
                 * Encodes the specified PartitionResponse message. Does not implicitly {@link google.spanner.v1.PartitionResponse.verify|verify} messages.
                 * @param message PartitionResponse message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.v1.IPartitionResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified PartitionResponse message, length delimited. Does not implicitly {@link google.spanner.v1.PartitionResponse.verify|verify} messages.
                 * @param message PartitionResponse message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.v1.IPartitionResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a PartitionResponse message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns PartitionResponse
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.v1.PartitionResponse;

                /**
                 * Decodes a PartitionResponse message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns PartitionResponse
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.v1.PartitionResponse;

                /**
                 * Verifies a PartitionResponse message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a PartitionResponse message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns PartitionResponse
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.v1.PartitionResponse;

                /**
                 * Creates a plain object from a PartitionResponse message. Also converts values to other types if specified.
                 * @param message PartitionResponse
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.v1.PartitionResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this PartitionResponse to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a ReadRequest. */
            interface IReadRequest {

                /** ReadRequest session */
                session?: (string|null);

                /** ReadRequest transaction */
                transaction?: (google.spanner.v1.ITransactionSelector|null);

                /** ReadRequest table */
                table?: (string|null);

                /** ReadRequest index */
                index?: (string|null);

                /** ReadRequest columns */
                columns?: (string[]|null);

                /** ReadRequest keySet */
                keySet?: (google.spanner.v1.IKeySet|null);

                /** ReadRequest limit */
                limit?: (number|Long|string|null);

                /** ReadRequest resumeToken */
                resumeToken?: (Uint8Array|string|null);

                /** ReadRequest partitionToken */
                partitionToken?: (Uint8Array|string|null);

                /** ReadRequest requestOptions */
                requestOptions?: (google.spanner.v1.IRequestOptions|null);
            }

            /** Represents a ReadRequest. */
            class ReadRequest implements IReadRequest {

                /**
                 * Constructs a new ReadRequest.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.v1.IReadRequest);

                /** ReadRequest session. */
                public session: string;

                /** ReadRequest transaction. */
                public transaction?: (google.spanner.v1.ITransactionSelector|null);

                /** ReadRequest table. */
                public table: string;

                /** ReadRequest index. */
                public index: string;

                /** ReadRequest columns. */
                public columns: string[];

                /** ReadRequest keySet. */
                public keySet?: (google.spanner.v1.IKeySet|null);

                /** ReadRequest limit. */
                public limit: (number|Long|string);

                /** ReadRequest resumeToken. */
                public resumeToken: (Uint8Array|string);

                /** ReadRequest partitionToken. */
                public partitionToken: (Uint8Array|string);

                /** ReadRequest requestOptions. */
                public requestOptions?: (google.spanner.v1.IRequestOptions|null);

                /**
                 * Creates a new ReadRequest instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns ReadRequest instance
                 */
                public static create(properties?: google.spanner.v1.IReadRequest): google.spanner.v1.ReadRequest;

                /**
                 * Encodes the specified ReadRequest message. Does not implicitly {@link google.spanner.v1.ReadRequest.verify|verify} messages.
                 * @param message ReadRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.v1.IReadRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified ReadRequest message, length delimited. Does not implicitly {@link google.spanner.v1.ReadRequest.verify|verify} messages.
                 * @param message ReadRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.v1.IReadRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a ReadRequest message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns ReadRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.v1.ReadRequest;

                /**
                 * Decodes a ReadRequest message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns ReadRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.v1.ReadRequest;

                /**
                 * Verifies a ReadRequest message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a ReadRequest message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns ReadRequest
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.v1.ReadRequest;

                /**
                 * Creates a plain object from a ReadRequest message. Also converts values to other types if specified.
                 * @param message ReadRequest
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.v1.ReadRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this ReadRequest to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a BeginTransactionRequest. */
            interface IBeginTransactionRequest {

                /** BeginTransactionRequest session */
                session?: (string|null);

                /** BeginTransactionRequest options */
                options?: (google.spanner.v1.ITransactionOptions|null);

                /** BeginTransactionRequest requestOptions */
                requestOptions?: (google.spanner.v1.IRequestOptions|null);
            }

            /** Represents a BeginTransactionRequest. */
            class BeginTransactionRequest implements IBeginTransactionRequest {

                /**
                 * Constructs a new BeginTransactionRequest.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.v1.IBeginTransactionRequest);

                /** BeginTransactionRequest session. */
                public session: string;

                /** BeginTransactionRequest options. */
                public options?: (google.spanner.v1.ITransactionOptions|null);

                /** BeginTransactionRequest requestOptions. */
                public requestOptions?: (google.spanner.v1.IRequestOptions|null);

                /**
                 * Creates a new BeginTransactionRequest instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns BeginTransactionRequest instance
                 */
                public static create(properties?: google.spanner.v1.IBeginTransactionRequest): google.spanner.v1.BeginTransactionRequest;

                /**
                 * Encodes the specified BeginTransactionRequest message. Does not implicitly {@link google.spanner.v1.BeginTransactionRequest.verify|verify} messages.
                 * @param message BeginTransactionRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.v1.IBeginTransactionRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified BeginTransactionRequest message, length delimited. Does not implicitly {@link google.spanner.v1.BeginTransactionRequest.verify|verify} messages.
                 * @param message BeginTransactionRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.v1.IBeginTransactionRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a BeginTransactionRequest message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns BeginTransactionRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.v1.BeginTransactionRequest;

                /**
                 * Decodes a BeginTransactionRequest message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns BeginTransactionRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.v1.BeginTransactionRequest;

                /**
                 * Verifies a BeginTransactionRequest message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a BeginTransactionRequest message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns BeginTransactionRequest
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.v1.BeginTransactionRequest;

                /**
                 * Creates a plain object from a BeginTransactionRequest message. Also converts values to other types if specified.
                 * @param message BeginTransactionRequest
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.v1.BeginTransactionRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this BeginTransactionRequest to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a CommitRequest. */
            interface ICommitRequest {

                /** CommitRequest session */
                session?: (string|null);

                /** CommitRequest transactionId */
                transactionId?: (Uint8Array|string|null);

                /** CommitRequest singleUseTransaction */
                singleUseTransaction?: (google.spanner.v1.ITransactionOptions|null);

                /** CommitRequest mutations */
                mutations?: (google.spanner.v1.IMutation[]|null);

                /** CommitRequest returnCommitStats */
                returnCommitStats?: (boolean|null);

                /** CommitRequest requestOptions */
                requestOptions?: (google.spanner.v1.IRequestOptions|null);
            }

            /** Represents a CommitRequest. */
            class CommitRequest implements ICommitRequest {

                /**
                 * Constructs a new CommitRequest.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.v1.ICommitRequest);

                /** CommitRequest session. */
                public session: string;

                /** CommitRequest transactionId. */
                public transactionId?: (Uint8Array|string|null);

                /** CommitRequest singleUseTransaction. */
                public singleUseTransaction?: (google.spanner.v1.ITransactionOptions|null);

                /** CommitRequest mutations. */
                public mutations: google.spanner.v1.IMutation[];

                /** CommitRequest returnCommitStats. */
                public returnCommitStats: boolean;

                /** CommitRequest requestOptions. */
                public requestOptions?: (google.spanner.v1.IRequestOptions|null);

                /** CommitRequest transaction. */
                public transaction?: ("transactionId"|"singleUseTransaction");

                /**
                 * Creates a new CommitRequest instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns CommitRequest instance
                 */
                public static create(properties?: google.spanner.v1.ICommitRequest): google.spanner.v1.CommitRequest;

                /**
                 * Encodes the specified CommitRequest message. Does not implicitly {@link google.spanner.v1.CommitRequest.verify|verify} messages.
                 * @param message CommitRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.v1.ICommitRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified CommitRequest message, length delimited. Does not implicitly {@link google.spanner.v1.CommitRequest.verify|verify} messages.
                 * @param message CommitRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.v1.ICommitRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a CommitRequest message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns CommitRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.v1.CommitRequest;

                /**
                 * Decodes a CommitRequest message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns CommitRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.v1.CommitRequest;

                /**
                 * Verifies a CommitRequest message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a CommitRequest message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns CommitRequest
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.v1.CommitRequest;

                /**
                 * Creates a plain object from a CommitRequest message. Also converts values to other types if specified.
                 * @param message CommitRequest
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.v1.CommitRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this CommitRequest to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a RollbackRequest. */
            interface IRollbackRequest {

                /** RollbackRequest session */
                session?: (string|null);

                /** RollbackRequest transactionId */
                transactionId?: (Uint8Array|string|null);
            }

            /** Represents a RollbackRequest. */
            class RollbackRequest implements IRollbackRequest {

                /**
                 * Constructs a new RollbackRequest.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.spanner.v1.IRollbackRequest);

                /** RollbackRequest session. */
                public session: string;

                /** RollbackRequest transactionId. */
                public transactionId: (Uint8Array|string);

                /**
                 * Creates a new RollbackRequest instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns RollbackRequest instance
                 */
                public static create(properties?: google.spanner.v1.IRollbackRequest): google.spanner.v1.RollbackRequest;

                /**
                 * Encodes the specified RollbackRequest message. Does not implicitly {@link google.spanner.v1.RollbackRequest.verify|verify} messages.
                 * @param message RollbackRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.spanner.v1.IRollbackRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified RollbackRequest message, length delimited. Does not implicitly {@link google.spanner.v1.RollbackRequest.verify|verify} messages.
                 * @param message RollbackRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.spanner.v1.IRollbackRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a RollbackRequest message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns RollbackRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.spanner.v1.RollbackRequest;

                /**
                 * Decodes a RollbackRequest message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns RollbackRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.spanner.v1.RollbackRequest;

                /**
                 * Verifies a RollbackRequest message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a RollbackRequest message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns RollbackRequest
                 */
                public static fromObject(object: { [k: string]: any }): google.spanner.v1.RollbackRequest;

                /**
                 * Creates a plain object from a RollbackRequest message. Also converts values to other types if specified.
                 * @param message RollbackRequest
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.spanner.v1.RollbackRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this RollbackRequest to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }
        }
    }

    /** Namespace api. */
    namespace api {

        /** FieldBehavior enum. */
        enum FieldBehavior {
            FIELD_BEHAVIOR_UNSPECIFIED = 0,
            OPTIONAL = 1,
            REQUIRED = 2,
            OUTPUT_ONLY = 3,
            INPUT_ONLY = 4,
            IMMUTABLE = 5,
            UNORDERED_LIST = 6,
            NON_EMPTY_DEFAULT = 7
        }

        /** Properties of a ResourceDescriptor. */
        interface IResourceDescriptor {

            /** ResourceDescriptor type */
            type?: (string|null);

            /** ResourceDescriptor pattern */
            pattern?: (string[]|null);

            /** ResourceDescriptor nameField */
            nameField?: (string|null);

            /** ResourceDescriptor history */
            history?: (google.api.ResourceDescriptor.History|keyof typeof google.api.ResourceDescriptor.History|null);

            /** ResourceDescriptor plural */
            plural?: (string|null);

            /** ResourceDescriptor singular */
            singular?: (string|null);

            /** ResourceDescriptor style */
            style?: (google.api.ResourceDescriptor.Style[]|null);
        }

        /** Represents a ResourceDescriptor. */
        class ResourceDescriptor implements IResourceDescriptor {

            /**
             * Constructs a new ResourceDescriptor.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.api.IResourceDescriptor);

            /** ResourceDescriptor type. */
            public type: string;

            /** ResourceDescriptor pattern. */
            public pattern: string[];

            /** ResourceDescriptor nameField. */
            public nameField: string;

            /** ResourceDescriptor history. */
            public history: (google.api.ResourceDescriptor.History|keyof typeof google.api.ResourceDescriptor.History);

            /** ResourceDescriptor plural. */
            public plural: string;

            /** ResourceDescriptor singular. */
            public singular: string;

            /** ResourceDescriptor style. */
            public style: google.api.ResourceDescriptor.Style[];

            /**
             * Creates a new ResourceDescriptor instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ResourceDescriptor instance
             */
            public static create(properties?: google.api.IResourceDescriptor): google.api.ResourceDescriptor;

            /**
             * Encodes the specified ResourceDescriptor message. Does not implicitly {@link google.api.ResourceDescriptor.verify|verify} messages.
             * @param message ResourceDescriptor message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.api.IResourceDescriptor, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ResourceDescriptor message, length delimited. Does not implicitly {@link google.api.ResourceDescriptor.verify|verify} messages.
             * @param message ResourceDescriptor message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.api.IResourceDescriptor, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ResourceDescriptor message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ResourceDescriptor
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.api.ResourceDescriptor;

            /**
             * Decodes a ResourceDescriptor message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ResourceDescriptor
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.api.ResourceDescriptor;

            /**
             * Verifies a ResourceDescriptor message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ResourceDescriptor message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ResourceDescriptor
             */
            public static fromObject(object: { [k: string]: any }): google.api.ResourceDescriptor;

            /**
             * Creates a plain object from a ResourceDescriptor message. Also converts values to other types if specified.
             * @param message ResourceDescriptor
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.api.ResourceDescriptor, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ResourceDescriptor to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        namespace ResourceDescriptor {

            /** History enum. */
            enum History {
                HISTORY_UNSPECIFIED = 0,
                ORIGINALLY_SINGLE_PATTERN = 1,
                FUTURE_MULTI_PATTERN = 2
            }

            /** Style enum. */
            enum Style {
                STYLE_UNSPECIFIED = 0,
                DECLARATIVE_FRIENDLY = 1
            }
        }

        /** Properties of a ResourceReference. */
        interface IResourceReference {

            /** ResourceReference type */
            type?: (string|null);

            /** ResourceReference childType */
            childType?: (string|null);
        }

        /** Represents a ResourceReference. */
        class ResourceReference implements IResourceReference {

            /**
             * Constructs a new ResourceReference.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.api.IResourceReference);

            /** ResourceReference type. */
            public type: string;

            /** ResourceReference childType. */
            public childType: string;

            /**
             * Creates a new ResourceReference instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ResourceReference instance
             */
            public static create(properties?: google.api.IResourceReference): google.api.ResourceReference;

            /**
             * Encodes the specified ResourceReference message. Does not implicitly {@link google.api.ResourceReference.verify|verify} messages.
             * @param message ResourceReference message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.api.IResourceReference, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ResourceReference message, length delimited. Does not implicitly {@link google.api.ResourceReference.verify|verify} messages.
             * @param message ResourceReference message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.api.IResourceReference, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ResourceReference message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ResourceReference
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.api.ResourceReference;

            /**
             * Decodes a ResourceReference message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ResourceReference
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.api.ResourceReference;

            /**
             * Verifies a ResourceReference message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ResourceReference message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ResourceReference
             */
            public static fromObject(object: { [k: string]: any }): google.api.ResourceReference;

            /**
             * Creates a plain object from a ResourceReference message. Also converts values to other types if specified.
             * @param message ResourceReference
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.api.ResourceReference, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ResourceReference to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a Http. */
        interface IHttp {

            /** Http rules */
            rules?: (google.api.IHttpRule[]|null);

            /** Http fullyDecodeReservedExpansion */
            fullyDecodeReservedExpansion?: (boolean|null);
        }

        /** Represents a Http. */
        class Http implements IHttp {

            /**
             * Constructs a new Http.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.api.IHttp);

            /** Http rules. */
            public rules: google.api.IHttpRule[];

            /** Http fullyDecodeReservedExpansion. */
            public fullyDecodeReservedExpansion: boolean;

            /**
             * Creates a new Http instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Http instance
             */
            public static create(properties?: google.api.IHttp): google.api.Http;

            /**
             * Encodes the specified Http message. Does not implicitly {@link google.api.Http.verify|verify} messages.
             * @param message Http message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.api.IHttp, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Http message, length delimited. Does not implicitly {@link google.api.Http.verify|verify} messages.
             * @param message Http message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.api.IHttp, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a Http message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Http
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.api.Http;

            /**
             * Decodes a Http message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Http
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.api.Http;

            /**
             * Verifies a Http message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a Http message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Http
             */
            public static fromObject(object: { [k: string]: any }): google.api.Http;

            /**
             * Creates a plain object from a Http message. Also converts values to other types if specified.
             * @param message Http
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.api.Http, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Http to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a HttpRule. */
        interface IHttpRule {

            /** HttpRule selector */
            selector?: (string|null);

            /** HttpRule get */
            get?: (string|null);

            /** HttpRule put */
            put?: (string|null);

            /** HttpRule post */
            post?: (string|null);

            /** HttpRule delete */
            "delete"?: (string|null);

            /** HttpRule patch */
            patch?: (string|null);

            /** HttpRule custom */
            custom?: (google.api.ICustomHttpPattern|null);

            /** HttpRule body */
            body?: (string|null);

            /** HttpRule responseBody */
            responseBody?: (string|null);

            /** HttpRule additionalBindings */
            additionalBindings?: (google.api.IHttpRule[]|null);
        }

        /** Represents a HttpRule. */
        class HttpRule implements IHttpRule {

            /**
             * Constructs a new HttpRule.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.api.IHttpRule);

            /** HttpRule selector. */
            public selector: string;

            /** HttpRule get. */
            public get?: (string|null);

            /** HttpRule put. */
            public put?: (string|null);

            /** HttpRule post. */
            public post?: (string|null);

            /** HttpRule delete. */
            public delete?: (string|null);

            /** HttpRule patch. */
            public patch?: (string|null);

            /** HttpRule custom. */
            public custom?: (google.api.ICustomHttpPattern|null);

            /** HttpRule body. */
            public body: string;

            /** HttpRule responseBody. */
            public responseBody: string;

            /** HttpRule additionalBindings. */
            public additionalBindings: google.api.IHttpRule[];

            /** HttpRule pattern. */
            public pattern?: ("get"|"put"|"post"|"delete"|"patch"|"custom");

            /**
             * Creates a new HttpRule instance using the specified properties.
             * @param [properties] Properties to set
             * @returns HttpRule instance
             */
            public static create(properties?: google.api.IHttpRule): google.api.HttpRule;

            /**
             * Encodes the specified HttpRule message. Does not implicitly {@link google.api.HttpRule.verify|verify} messages.
             * @param message HttpRule message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.api.IHttpRule, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified HttpRule message, length delimited. Does not implicitly {@link google.api.HttpRule.verify|verify} messages.
             * @param message HttpRule message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.api.IHttpRule, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a HttpRule message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns HttpRule
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.api.HttpRule;

            /**
             * Decodes a HttpRule message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns HttpRule
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.api.HttpRule;

            /**
             * Verifies a HttpRule message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a HttpRule message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns HttpRule
             */
            public static fromObject(object: { [k: string]: any }): google.api.HttpRule;

            /**
             * Creates a plain object from a HttpRule message. Also converts values to other types if specified.
             * @param message HttpRule
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.api.HttpRule, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this HttpRule to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a CustomHttpPattern. */
        interface ICustomHttpPattern {

            /** CustomHttpPattern kind */
            kind?: (string|null);

            /** CustomHttpPattern path */
            path?: (string|null);
        }

        /** Represents a CustomHttpPattern. */
        class CustomHttpPattern implements ICustomHttpPattern {

            /**
             * Constructs a new CustomHttpPattern.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.api.ICustomHttpPattern);

            /** CustomHttpPattern kind. */
            public kind: string;

            /** CustomHttpPattern path. */
            public path: string;

            /**
             * Creates a new CustomHttpPattern instance using the specified properties.
             * @param [properties] Properties to set
             * @returns CustomHttpPattern instance
             */
            public static create(properties?: google.api.ICustomHttpPattern): google.api.CustomHttpPattern;

            /**
             * Encodes the specified CustomHttpPattern message. Does not implicitly {@link google.api.CustomHttpPattern.verify|verify} messages.
             * @param message CustomHttpPattern message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.api.ICustomHttpPattern, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified CustomHttpPattern message, length delimited. Does not implicitly {@link google.api.CustomHttpPattern.verify|verify} messages.
             * @param message CustomHttpPattern message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.api.ICustomHttpPattern, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a CustomHttpPattern message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns CustomHttpPattern
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.api.CustomHttpPattern;

            /**
             * Decodes a CustomHttpPattern message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns CustomHttpPattern
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.api.CustomHttpPattern;

            /**
             * Verifies a CustomHttpPattern message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a CustomHttpPattern message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns CustomHttpPattern
             */
            public static fromObject(object: { [k: string]: any }): google.api.CustomHttpPattern;

            /**
             * Creates a plain object from a CustomHttpPattern message. Also converts values to other types if specified.
             * @param message CustomHttpPattern
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.api.CustomHttpPattern, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this CustomHttpPattern to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }
    }

    /** Namespace longrunning. */
    namespace longrunning {

        /** Represents an Operations */
        class Operations extends $protobuf.rpc.Service {

            /**
             * Constructs a new Operations service.
             * @param rpcImpl RPC implementation
             * @param [requestDelimited=false] Whether requests are length-delimited
             * @param [responseDelimited=false] Whether responses are length-delimited
             */
            constructor(rpcImpl: $protobuf.RPCImpl, requestDelimited?: boolean, responseDelimited?: boolean);

            /**
             * Creates new Operations service using the specified rpc implementation.
             * @param rpcImpl RPC implementation
             * @param [requestDelimited=false] Whether requests are length-delimited
             * @param [responseDelimited=false] Whether responses are length-delimited
             * @returns RPC service. Useful where requests and/or responses are streamed.
             */
            public static create(rpcImpl: $protobuf.RPCImpl, requestDelimited?: boolean, responseDelimited?: boolean): Operations;

            /**
             * Calls ListOperations.
             * @param request ListOperationsRequest message or plain object
             * @param callback Node-style callback called with the error, if any, and ListOperationsResponse
             */
            public listOperations(request: google.longrunning.IListOperationsRequest, callback: google.longrunning.Operations.ListOperationsCallback): void;

            /**
             * Calls ListOperations.
             * @param request ListOperationsRequest message or plain object
             * @returns Promise
             */
            public listOperations(request: google.longrunning.IListOperationsRequest): Promise<google.longrunning.ListOperationsResponse>;

            /**
             * Calls GetOperation.
             * @param request GetOperationRequest message or plain object
             * @param callback Node-style callback called with the error, if any, and Operation
             */
            public getOperation(request: google.longrunning.IGetOperationRequest, callback: google.longrunning.Operations.GetOperationCallback): void;

            /**
             * Calls GetOperation.
             * @param request GetOperationRequest message or plain object
             * @returns Promise
             */
            public getOperation(request: google.longrunning.IGetOperationRequest): Promise<google.longrunning.Operation>;

            /**
             * Calls DeleteOperation.
             * @param request DeleteOperationRequest message or plain object
             * @param callback Node-style callback called with the error, if any, and Empty
             */
            public deleteOperation(request: google.longrunning.IDeleteOperationRequest, callback: google.longrunning.Operations.DeleteOperationCallback): void;

            /**
             * Calls DeleteOperation.
             * @param request DeleteOperationRequest message or plain object
             * @returns Promise
             */
            public deleteOperation(request: google.longrunning.IDeleteOperationRequest): Promise<google.protobuf.Empty>;

            /**
             * Calls CancelOperation.
             * @param request CancelOperationRequest message or plain object
             * @param callback Node-style callback called with the error, if any, and Empty
             */
            public cancelOperation(request: google.longrunning.ICancelOperationRequest, callback: google.longrunning.Operations.CancelOperationCallback): void;

            /**
             * Calls CancelOperation.
             * @param request CancelOperationRequest message or plain object
             * @returns Promise
             */
            public cancelOperation(request: google.longrunning.ICancelOperationRequest): Promise<google.protobuf.Empty>;

            /**
             * Calls WaitOperation.
             * @param request WaitOperationRequest message or plain object
             * @param callback Node-style callback called with the error, if any, and Operation
             */
            public waitOperation(request: google.longrunning.IWaitOperationRequest, callback: google.longrunning.Operations.WaitOperationCallback): void;

            /**
             * Calls WaitOperation.
             * @param request WaitOperationRequest message or plain object
             * @returns Promise
             */
            public waitOperation(request: google.longrunning.IWaitOperationRequest): Promise<google.longrunning.Operation>;
        }

        namespace Operations {

            /**
             * Callback as used by {@link google.longrunning.Operations#listOperations}.
             * @param error Error, if any
             * @param [response] ListOperationsResponse
             */
            type ListOperationsCallback = (error: (Error|null), response?: google.longrunning.ListOperationsResponse) => void;

            /**
             * Callback as used by {@link google.longrunning.Operations#getOperation}.
             * @param error Error, if any
             * @param [response] Operation
             */
            type GetOperationCallback = (error: (Error|null), response?: google.longrunning.Operation) => void;

            /**
             * Callback as used by {@link google.longrunning.Operations#deleteOperation}.
             * @param error Error, if any
             * @param [response] Empty
             */
            type DeleteOperationCallback = (error: (Error|null), response?: google.protobuf.Empty) => void;

            /**
             * Callback as used by {@link google.longrunning.Operations#cancelOperation}.
             * @param error Error, if any
             * @param [response] Empty
             */
            type CancelOperationCallback = (error: (Error|null), response?: google.protobuf.Empty) => void;

            /**
             * Callback as used by {@link google.longrunning.Operations#waitOperation}.
             * @param error Error, if any
             * @param [response] Operation
             */
            type WaitOperationCallback = (error: (Error|null), response?: google.longrunning.Operation) => void;
        }

        /** Properties of an Operation. */
        interface IOperation {

            /** Operation name */
            name?: (string|null);

            /** Operation metadata */
            metadata?: (google.protobuf.IAny|null);

            /** Operation done */
            done?: (boolean|null);

            /** Operation error */
            error?: (google.rpc.IStatus|null);

            /** Operation response */
            response?: (google.protobuf.IAny|null);
        }

        /** Represents an Operation. */
        class Operation implements IOperation {

            /**
             * Constructs a new Operation.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.longrunning.IOperation);

            /** Operation name. */
            public name: string;

            /** Operation metadata. */
            public metadata?: (google.protobuf.IAny|null);

            /** Operation done. */
            public done: boolean;

            /** Operation error. */
            public error?: (google.rpc.IStatus|null);

            /** Operation response. */
            public response?: (google.protobuf.IAny|null);

            /** Operation result. */
            public result?: ("error"|"response");

            /**
             * Creates a new Operation instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Operation instance
             */
            public static create(properties?: google.longrunning.IOperation): google.longrunning.Operation;

            /**
             * Encodes the specified Operation message. Does not implicitly {@link google.longrunning.Operation.verify|verify} messages.
             * @param message Operation message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.longrunning.IOperation, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Operation message, length delimited. Does not implicitly {@link google.longrunning.Operation.verify|verify} messages.
             * @param message Operation message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.longrunning.IOperation, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an Operation message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Operation
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.longrunning.Operation;

            /**
             * Decodes an Operation message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Operation
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.longrunning.Operation;

            /**
             * Verifies an Operation message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an Operation message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Operation
             */
            public static fromObject(object: { [k: string]: any }): google.longrunning.Operation;

            /**
             * Creates a plain object from an Operation message. Also converts values to other types if specified.
             * @param message Operation
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.longrunning.Operation, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Operation to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a GetOperationRequest. */
        interface IGetOperationRequest {

            /** GetOperationRequest name */
            name?: (string|null);
        }

        /** Represents a GetOperationRequest. */
        class GetOperationRequest implements IGetOperationRequest {

            /**
             * Constructs a new GetOperationRequest.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.longrunning.IGetOperationRequest);

            /** GetOperationRequest name. */
            public name: string;

            /**
             * Creates a new GetOperationRequest instance using the specified properties.
             * @param [properties] Properties to set
             * @returns GetOperationRequest instance
             */
            public static create(properties?: google.longrunning.IGetOperationRequest): google.longrunning.GetOperationRequest;

            /**
             * Encodes the specified GetOperationRequest message. Does not implicitly {@link google.longrunning.GetOperationRequest.verify|verify} messages.
             * @param message GetOperationRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.longrunning.IGetOperationRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified GetOperationRequest message, length delimited. Does not implicitly {@link google.longrunning.GetOperationRequest.verify|verify} messages.
             * @param message GetOperationRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.longrunning.IGetOperationRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a GetOperationRequest message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns GetOperationRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.longrunning.GetOperationRequest;

            /**
             * Decodes a GetOperationRequest message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns GetOperationRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.longrunning.GetOperationRequest;

            /**
             * Verifies a GetOperationRequest message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a GetOperationRequest message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns GetOperationRequest
             */
            public static fromObject(object: { [k: string]: any }): google.longrunning.GetOperationRequest;

            /**
             * Creates a plain object from a GetOperationRequest message. Also converts values to other types if specified.
             * @param message GetOperationRequest
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.longrunning.GetOperationRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this GetOperationRequest to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a ListOperationsRequest. */
        interface IListOperationsRequest {

            /** ListOperationsRequest name */
            name?: (string|null);

            /** ListOperationsRequest filter */
            filter?: (string|null);

            /** ListOperationsRequest pageSize */
            pageSize?: (number|null);

            /** ListOperationsRequest pageToken */
            pageToken?: (string|null);
        }

        /** Represents a ListOperationsRequest. */
        class ListOperationsRequest implements IListOperationsRequest {

            /**
             * Constructs a new ListOperationsRequest.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.longrunning.IListOperationsRequest);

            /** ListOperationsRequest name. */
            public name: string;

            /** ListOperationsRequest filter. */
            public filter: string;

            /** ListOperationsRequest pageSize. */
            public pageSize: number;

            /** ListOperationsRequest pageToken. */
            public pageToken: string;

            /**
             * Creates a new ListOperationsRequest instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ListOperationsRequest instance
             */
            public static create(properties?: google.longrunning.IListOperationsRequest): google.longrunning.ListOperationsRequest;

            /**
             * Encodes the specified ListOperationsRequest message. Does not implicitly {@link google.longrunning.ListOperationsRequest.verify|verify} messages.
             * @param message ListOperationsRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.longrunning.IListOperationsRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ListOperationsRequest message, length delimited. Does not implicitly {@link google.longrunning.ListOperationsRequest.verify|verify} messages.
             * @param message ListOperationsRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.longrunning.IListOperationsRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ListOperationsRequest message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ListOperationsRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.longrunning.ListOperationsRequest;

            /**
             * Decodes a ListOperationsRequest message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ListOperationsRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.longrunning.ListOperationsRequest;

            /**
             * Verifies a ListOperationsRequest message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ListOperationsRequest message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ListOperationsRequest
             */
            public static fromObject(object: { [k: string]: any }): google.longrunning.ListOperationsRequest;

            /**
             * Creates a plain object from a ListOperationsRequest message. Also converts values to other types if specified.
             * @param message ListOperationsRequest
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.longrunning.ListOperationsRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ListOperationsRequest to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a ListOperationsResponse. */
        interface IListOperationsResponse {

            /** ListOperationsResponse operations */
            operations?: (google.longrunning.IOperation[]|null);

            /** ListOperationsResponse nextPageToken */
            nextPageToken?: (string|null);
        }

        /** Represents a ListOperationsResponse. */
        class ListOperationsResponse implements IListOperationsResponse {

            /**
             * Constructs a new ListOperationsResponse.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.longrunning.IListOperationsResponse);

            /** ListOperationsResponse operations. */
            public operations: google.longrunning.IOperation[];

            /** ListOperationsResponse nextPageToken. */
            public nextPageToken: string;

            /**
             * Creates a new ListOperationsResponse instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ListOperationsResponse instance
             */
            public static create(properties?: google.longrunning.IListOperationsResponse): google.longrunning.ListOperationsResponse;

            /**
             * Encodes the specified ListOperationsResponse message. Does not implicitly {@link google.longrunning.ListOperationsResponse.verify|verify} messages.
             * @param message ListOperationsResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.longrunning.IListOperationsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified ListOperationsResponse message, length delimited. Does not implicitly {@link google.longrunning.ListOperationsResponse.verify|verify} messages.
             * @param message ListOperationsResponse message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.longrunning.IListOperationsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a ListOperationsResponse message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ListOperationsResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.longrunning.ListOperationsResponse;

            /**
             * Decodes a ListOperationsResponse message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ListOperationsResponse
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.longrunning.ListOperationsResponse;

            /**
             * Verifies a ListOperationsResponse message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a ListOperationsResponse message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ListOperationsResponse
             */
            public static fromObject(object: { [k: string]: any }): google.longrunning.ListOperationsResponse;

            /**
             * Creates a plain object from a ListOperationsResponse message. Also converts values to other types if specified.
             * @param message ListOperationsResponse
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.longrunning.ListOperationsResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this ListOperationsResponse to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a CancelOperationRequest. */
        interface ICancelOperationRequest {

            /** CancelOperationRequest name */
            name?: (string|null);
        }

        /** Represents a CancelOperationRequest. */
        class CancelOperationRequest implements ICancelOperationRequest {

            /**
             * Constructs a new CancelOperationRequest.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.longrunning.ICancelOperationRequest);

            /** CancelOperationRequest name. */
            public name: string;

            /**
             * Creates a new CancelOperationRequest instance using the specified properties.
             * @param [properties] Properties to set
             * @returns CancelOperationRequest instance
             */
            public static create(properties?: google.longrunning.ICancelOperationRequest): google.longrunning.CancelOperationRequest;

            /**
             * Encodes the specified CancelOperationRequest message. Does not implicitly {@link google.longrunning.CancelOperationRequest.verify|verify} messages.
             * @param message CancelOperationRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.longrunning.ICancelOperationRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified CancelOperationRequest message, length delimited. Does not implicitly {@link google.longrunning.CancelOperationRequest.verify|verify} messages.
             * @param message CancelOperationRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.longrunning.ICancelOperationRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a CancelOperationRequest message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns CancelOperationRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.longrunning.CancelOperationRequest;

            /**
             * Decodes a CancelOperationRequest message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns CancelOperationRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.longrunning.CancelOperationRequest;

            /**
             * Verifies a CancelOperationRequest message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a CancelOperationRequest message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns CancelOperationRequest
             */
            public static fromObject(object: { [k: string]: any }): google.longrunning.CancelOperationRequest;

            /**
             * Creates a plain object from a CancelOperationRequest message. Also converts values to other types if specified.
             * @param message CancelOperationRequest
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.longrunning.CancelOperationRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this CancelOperationRequest to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a DeleteOperationRequest. */
        interface IDeleteOperationRequest {

            /** DeleteOperationRequest name */
            name?: (string|null);
        }

        /** Represents a DeleteOperationRequest. */
        class DeleteOperationRequest implements IDeleteOperationRequest {

            /**
             * Constructs a new DeleteOperationRequest.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.longrunning.IDeleteOperationRequest);

            /** DeleteOperationRequest name. */
            public name: string;

            /**
             * Creates a new DeleteOperationRequest instance using the specified properties.
             * @param [properties] Properties to set
             * @returns DeleteOperationRequest instance
             */
            public static create(properties?: google.longrunning.IDeleteOperationRequest): google.longrunning.DeleteOperationRequest;

            /**
             * Encodes the specified DeleteOperationRequest message. Does not implicitly {@link google.longrunning.DeleteOperationRequest.verify|verify} messages.
             * @param message DeleteOperationRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.longrunning.IDeleteOperationRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified DeleteOperationRequest message, length delimited. Does not implicitly {@link google.longrunning.DeleteOperationRequest.verify|verify} messages.
             * @param message DeleteOperationRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.longrunning.IDeleteOperationRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a DeleteOperationRequest message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns DeleteOperationRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.longrunning.DeleteOperationRequest;

            /**
             * Decodes a DeleteOperationRequest message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns DeleteOperationRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.longrunning.DeleteOperationRequest;

            /**
             * Verifies a DeleteOperationRequest message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a DeleteOperationRequest message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns DeleteOperationRequest
             */
            public static fromObject(object: { [k: string]: any }): google.longrunning.DeleteOperationRequest;

            /**
             * Creates a plain object from a DeleteOperationRequest message. Also converts values to other types if specified.
             * @param message DeleteOperationRequest
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.longrunning.DeleteOperationRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this DeleteOperationRequest to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of a WaitOperationRequest. */
        interface IWaitOperationRequest {

            /** WaitOperationRequest name */
            name?: (string|null);

            /** WaitOperationRequest timeout */
            timeout?: (google.protobuf.IDuration|null);
        }

        /** Represents a WaitOperationRequest. */
        class WaitOperationRequest implements IWaitOperationRequest {

            /**
             * Constructs a new WaitOperationRequest.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.longrunning.IWaitOperationRequest);

            /** WaitOperationRequest name. */
            public name: string;

            /** WaitOperationRequest timeout. */
            public timeout?: (google.protobuf.IDuration|null);

            /**
             * Creates a new WaitOperationRequest instance using the specified properties.
             * @param [properties] Properties to set
             * @returns WaitOperationRequest instance
             */
            public static create(properties?: google.longrunning.IWaitOperationRequest): google.longrunning.WaitOperationRequest;

            /**
             * Encodes the specified WaitOperationRequest message. Does not implicitly {@link google.longrunning.WaitOperationRequest.verify|verify} messages.
             * @param message WaitOperationRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.longrunning.IWaitOperationRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified WaitOperationRequest message, length delimited. Does not implicitly {@link google.longrunning.WaitOperationRequest.verify|verify} messages.
             * @param message WaitOperationRequest message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.longrunning.IWaitOperationRequest, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes a WaitOperationRequest message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns WaitOperationRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.longrunning.WaitOperationRequest;

            /**
             * Decodes a WaitOperationRequest message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns WaitOperationRequest
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.longrunning.WaitOperationRequest;

            /**
             * Verifies a WaitOperationRequest message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates a WaitOperationRequest message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns WaitOperationRequest
             */
            public static fromObject(object: { [k: string]: any }): google.longrunning.WaitOperationRequest;

            /**
             * Creates a plain object from a WaitOperationRequest message. Also converts values to other types if specified.
             * @param message WaitOperationRequest
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.longrunning.WaitOperationRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this WaitOperationRequest to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }

        /** Properties of an OperationInfo. */
        interface IOperationInfo {

            /** OperationInfo responseType */
            responseType?: (string|null);

            /** OperationInfo metadataType */
            metadataType?: (string|null);
        }

        /** Represents an OperationInfo. */
        class OperationInfo implements IOperationInfo {

            /**
             * Constructs a new OperationInfo.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.longrunning.IOperationInfo);

            /** OperationInfo responseType. */
            public responseType: string;

            /** OperationInfo metadataType. */
            public metadataType: string;

            /**
             * Creates a new OperationInfo instance using the specified properties.
             * @param [properties] Properties to set
             * @returns OperationInfo instance
             */
            public static create(properties?: google.longrunning.IOperationInfo): google.longrunning.OperationInfo;

            /**
             * Encodes the specified OperationInfo message. Does not implicitly {@link google.longrunning.OperationInfo.verify|verify} messages.
             * @param message OperationInfo message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.longrunning.IOperationInfo, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified OperationInfo message, length delimited. Does not implicitly {@link google.longrunning.OperationInfo.verify|verify} messages.
             * @param message OperationInfo message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.longrunning.IOperationInfo, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an OperationInfo message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns OperationInfo
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.longrunning.OperationInfo;

            /**
             * Decodes an OperationInfo message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns OperationInfo
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.longrunning.OperationInfo;

            /**
             * Verifies an OperationInfo message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an OperationInfo message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns OperationInfo
             */
            public static fromObject(object: { [k: string]: any }): google.longrunning.OperationInfo;

            /**
             * Creates a plain object from an OperationInfo message. Also converts values to other types if specified.
             * @param message OperationInfo
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.longrunning.OperationInfo, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this OperationInfo to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }
    }

    /** Namespace iam. */
    namespace iam {

        /** Namespace v1. */
        namespace v1 {

            /** Represents a IAMPolicy */
            class IAMPolicy extends $protobuf.rpc.Service {

                /**
                 * Constructs a new IAMPolicy service.
                 * @param rpcImpl RPC implementation
                 * @param [requestDelimited=false] Whether requests are length-delimited
                 * @param [responseDelimited=false] Whether responses are length-delimited
                 */
                constructor(rpcImpl: $protobuf.RPCImpl, requestDelimited?: boolean, responseDelimited?: boolean);

                /**
                 * Creates new IAMPolicy service using the specified rpc implementation.
                 * @param rpcImpl RPC implementation
                 * @param [requestDelimited=false] Whether requests are length-delimited
                 * @param [responseDelimited=false] Whether responses are length-delimited
                 * @returns RPC service. Useful where requests and/or responses are streamed.
                 */
                public static create(rpcImpl: $protobuf.RPCImpl, requestDelimited?: boolean, responseDelimited?: boolean): IAMPolicy;

                /**
                 * Calls SetIamPolicy.
                 * @param request SetIamPolicyRequest message or plain object
                 * @param callback Node-style callback called with the error, if any, and Policy
                 */
                public setIamPolicy(request: google.iam.v1.ISetIamPolicyRequest, callback: google.iam.v1.IAMPolicy.SetIamPolicyCallback): void;

                /**
                 * Calls SetIamPolicy.
                 * @param request SetIamPolicyRequest message or plain object
                 * @returns Promise
                 */
                public setIamPolicy(request: google.iam.v1.ISetIamPolicyRequest): Promise<google.iam.v1.Policy>;

                /**
                 * Calls GetIamPolicy.
                 * @param request GetIamPolicyRequest message or plain object
                 * @param callback Node-style callback called with the error, if any, and Policy
                 */
                public getIamPolicy(request: google.iam.v1.IGetIamPolicyRequest, callback: google.iam.v1.IAMPolicy.GetIamPolicyCallback): void;

                /**
                 * Calls GetIamPolicy.
                 * @param request GetIamPolicyRequest message or plain object
                 * @returns Promise
                 */
                public getIamPolicy(request: google.iam.v1.IGetIamPolicyRequest): Promise<google.iam.v1.Policy>;

                /**
                 * Calls TestIamPermissions.
                 * @param request TestIamPermissionsRequest message or plain object
                 * @param callback Node-style callback called with the error, if any, and TestIamPermissionsResponse
                 */
                public testIamPermissions(request: google.iam.v1.ITestIamPermissionsRequest, callback: google.iam.v1.IAMPolicy.TestIamPermissionsCallback): void;

                /**
                 * Calls TestIamPermissions.
                 * @param request TestIamPermissionsRequest message or plain object
                 * @returns Promise
                 */
                public testIamPermissions(request: google.iam.v1.ITestIamPermissionsRequest): Promise<google.iam.v1.TestIamPermissionsResponse>;
            }

            namespace IAMPolicy {

                /**
                 * Callback as used by {@link google.iam.v1.IAMPolicy#setIamPolicy}.
                 * @param error Error, if any
                 * @param [response] Policy
                 */
                type SetIamPolicyCallback = (error: (Error|null), response?: google.iam.v1.Policy) => void;

                /**
                 * Callback as used by {@link google.iam.v1.IAMPolicy#getIamPolicy}.
                 * @param error Error, if any
                 * @param [response] Policy
                 */
                type GetIamPolicyCallback = (error: (Error|null), response?: google.iam.v1.Policy) => void;

                /**
                 * Callback as used by {@link google.iam.v1.IAMPolicy#testIamPermissions}.
                 * @param error Error, if any
                 * @param [response] TestIamPermissionsResponse
                 */
                type TestIamPermissionsCallback = (error: (Error|null), response?: google.iam.v1.TestIamPermissionsResponse) => void;
            }

            /** Properties of a SetIamPolicyRequest. */
            interface ISetIamPolicyRequest {

                /** SetIamPolicyRequest resource */
                resource?: (string|null);

                /** SetIamPolicyRequest policy */
                policy?: (google.iam.v1.IPolicy|null);
            }

            /** Represents a SetIamPolicyRequest. */
            class SetIamPolicyRequest implements ISetIamPolicyRequest {

                /**
                 * Constructs a new SetIamPolicyRequest.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.iam.v1.ISetIamPolicyRequest);

                /** SetIamPolicyRequest resource. */
                public resource: string;

                /** SetIamPolicyRequest policy. */
                public policy?: (google.iam.v1.IPolicy|null);

                /**
                 * Creates a new SetIamPolicyRequest instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns SetIamPolicyRequest instance
                 */
                public static create(properties?: google.iam.v1.ISetIamPolicyRequest): google.iam.v1.SetIamPolicyRequest;

                /**
                 * Encodes the specified SetIamPolicyRequest message. Does not implicitly {@link google.iam.v1.SetIamPolicyRequest.verify|verify} messages.
                 * @param message SetIamPolicyRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.iam.v1.ISetIamPolicyRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified SetIamPolicyRequest message, length delimited. Does not implicitly {@link google.iam.v1.SetIamPolicyRequest.verify|verify} messages.
                 * @param message SetIamPolicyRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.iam.v1.ISetIamPolicyRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a SetIamPolicyRequest message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns SetIamPolicyRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.iam.v1.SetIamPolicyRequest;

                /**
                 * Decodes a SetIamPolicyRequest message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns SetIamPolicyRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.iam.v1.SetIamPolicyRequest;

                /**
                 * Verifies a SetIamPolicyRequest message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a SetIamPolicyRequest message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns SetIamPolicyRequest
                 */
                public static fromObject(object: { [k: string]: any }): google.iam.v1.SetIamPolicyRequest;

                /**
                 * Creates a plain object from a SetIamPolicyRequest message. Also converts values to other types if specified.
                 * @param message SetIamPolicyRequest
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.iam.v1.SetIamPolicyRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this SetIamPolicyRequest to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a GetIamPolicyRequest. */
            interface IGetIamPolicyRequest {

                /** GetIamPolicyRequest resource */
                resource?: (string|null);

                /** GetIamPolicyRequest options */
                options?: (google.iam.v1.IGetPolicyOptions|null);
            }

            /** Represents a GetIamPolicyRequest. */
            class GetIamPolicyRequest implements IGetIamPolicyRequest {

                /**
                 * Constructs a new GetIamPolicyRequest.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.iam.v1.IGetIamPolicyRequest);

                /** GetIamPolicyRequest resource. */
                public resource: string;

                /** GetIamPolicyRequest options. */
                public options?: (google.iam.v1.IGetPolicyOptions|null);

                /**
                 * Creates a new GetIamPolicyRequest instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns GetIamPolicyRequest instance
                 */
                public static create(properties?: google.iam.v1.IGetIamPolicyRequest): google.iam.v1.GetIamPolicyRequest;

                /**
                 * Encodes the specified GetIamPolicyRequest message. Does not implicitly {@link google.iam.v1.GetIamPolicyRequest.verify|verify} messages.
                 * @param message GetIamPolicyRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.iam.v1.IGetIamPolicyRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified GetIamPolicyRequest message, length delimited. Does not implicitly {@link google.iam.v1.GetIamPolicyRequest.verify|verify} messages.
                 * @param message GetIamPolicyRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.iam.v1.IGetIamPolicyRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a GetIamPolicyRequest message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns GetIamPolicyRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.iam.v1.GetIamPolicyRequest;

                /**
                 * Decodes a GetIamPolicyRequest message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns GetIamPolicyRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.iam.v1.GetIamPolicyRequest;

                /**
                 * Verifies a GetIamPolicyRequest message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a GetIamPolicyRequest message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns GetIamPolicyRequest
                 */
                public static fromObject(object: { [k: string]: any }): google.iam.v1.GetIamPolicyRequest;

                /**
                 * Creates a plain object from a GetIamPolicyRequest message. Also converts values to other types if specified.
                 * @param message GetIamPolicyRequest
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.iam.v1.GetIamPolicyRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this GetIamPolicyRequest to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a TestIamPermissionsRequest. */
            interface ITestIamPermissionsRequest {

                /** TestIamPermissionsRequest resource */
                resource?: (string|null);

                /** TestIamPermissionsRequest permissions */
                permissions?: (string[]|null);
            }

            /** Represents a TestIamPermissionsRequest. */
            class TestIamPermissionsRequest implements ITestIamPermissionsRequest {

                /**
                 * Constructs a new TestIamPermissionsRequest.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.iam.v1.ITestIamPermissionsRequest);

                /** TestIamPermissionsRequest resource. */
                public resource: string;

                /** TestIamPermissionsRequest permissions. */
                public permissions: string[];

                /**
                 * Creates a new TestIamPermissionsRequest instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns TestIamPermissionsRequest instance
                 */
                public static create(properties?: google.iam.v1.ITestIamPermissionsRequest): google.iam.v1.TestIamPermissionsRequest;

                /**
                 * Encodes the specified TestIamPermissionsRequest message. Does not implicitly {@link google.iam.v1.TestIamPermissionsRequest.verify|verify} messages.
                 * @param message TestIamPermissionsRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.iam.v1.ITestIamPermissionsRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified TestIamPermissionsRequest message, length delimited. Does not implicitly {@link google.iam.v1.TestIamPermissionsRequest.verify|verify} messages.
                 * @param message TestIamPermissionsRequest message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.iam.v1.ITestIamPermissionsRequest, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a TestIamPermissionsRequest message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns TestIamPermissionsRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.iam.v1.TestIamPermissionsRequest;

                /**
                 * Decodes a TestIamPermissionsRequest message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns TestIamPermissionsRequest
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.iam.v1.TestIamPermissionsRequest;

                /**
                 * Verifies a TestIamPermissionsRequest message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a TestIamPermissionsRequest message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns TestIamPermissionsRequest
                 */
                public static fromObject(object: { [k: string]: any }): google.iam.v1.TestIamPermissionsRequest;

                /**
                 * Creates a plain object from a TestIamPermissionsRequest message. Also converts values to other types if specified.
                 * @param message TestIamPermissionsRequest
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.iam.v1.TestIamPermissionsRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this TestIamPermissionsRequest to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a TestIamPermissionsResponse. */
            interface ITestIamPermissionsResponse {

                /** TestIamPermissionsResponse permissions */
                permissions?: (string[]|null);
            }

            /** Represents a TestIamPermissionsResponse. */
            class TestIamPermissionsResponse implements ITestIamPermissionsResponse {

                /**
                 * Constructs a new TestIamPermissionsResponse.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.iam.v1.ITestIamPermissionsResponse);

                /** TestIamPermissionsResponse permissions. */
                public permissions: string[];

                /**
                 * Creates a new TestIamPermissionsResponse instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns TestIamPermissionsResponse instance
                 */
                public static create(properties?: google.iam.v1.ITestIamPermissionsResponse): google.iam.v1.TestIamPermissionsResponse;

                /**
                 * Encodes the specified TestIamPermissionsResponse message. Does not implicitly {@link google.iam.v1.TestIamPermissionsResponse.verify|verify} messages.
                 * @param message TestIamPermissionsResponse message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.iam.v1.ITestIamPermissionsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified TestIamPermissionsResponse message, length delimited. Does not implicitly {@link google.iam.v1.TestIamPermissionsResponse.verify|verify} messages.
                 * @param message TestIamPermissionsResponse message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.iam.v1.ITestIamPermissionsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a TestIamPermissionsResponse message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns TestIamPermissionsResponse
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.iam.v1.TestIamPermissionsResponse;

                /**
                 * Decodes a TestIamPermissionsResponse message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns TestIamPermissionsResponse
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.iam.v1.TestIamPermissionsResponse;

                /**
                 * Verifies a TestIamPermissionsResponse message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a TestIamPermissionsResponse message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns TestIamPermissionsResponse
                 */
                public static fromObject(object: { [k: string]: any }): google.iam.v1.TestIamPermissionsResponse;

                /**
                 * Creates a plain object from a TestIamPermissionsResponse message. Also converts values to other types if specified.
                 * @param message TestIamPermissionsResponse
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.iam.v1.TestIamPermissionsResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this TestIamPermissionsResponse to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a GetPolicyOptions. */
            interface IGetPolicyOptions {

                /** GetPolicyOptions requestedPolicyVersion */
                requestedPolicyVersion?: (number|null);
            }

            /** Represents a GetPolicyOptions. */
            class GetPolicyOptions implements IGetPolicyOptions {

                /**
                 * Constructs a new GetPolicyOptions.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.iam.v1.IGetPolicyOptions);

                /** GetPolicyOptions requestedPolicyVersion. */
                public requestedPolicyVersion: number;

                /**
                 * Creates a new GetPolicyOptions instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns GetPolicyOptions instance
                 */
                public static create(properties?: google.iam.v1.IGetPolicyOptions): google.iam.v1.GetPolicyOptions;

                /**
                 * Encodes the specified GetPolicyOptions message. Does not implicitly {@link google.iam.v1.GetPolicyOptions.verify|verify} messages.
                 * @param message GetPolicyOptions message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.iam.v1.IGetPolicyOptions, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified GetPolicyOptions message, length delimited. Does not implicitly {@link google.iam.v1.GetPolicyOptions.verify|verify} messages.
                 * @param message GetPolicyOptions message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.iam.v1.IGetPolicyOptions, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a GetPolicyOptions message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns GetPolicyOptions
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.iam.v1.GetPolicyOptions;

                /**
                 * Decodes a GetPolicyOptions message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns GetPolicyOptions
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.iam.v1.GetPolicyOptions;

                /**
                 * Verifies a GetPolicyOptions message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a GetPolicyOptions message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns GetPolicyOptions
                 */
                public static fromObject(object: { [k: string]: any }): google.iam.v1.GetPolicyOptions;

                /**
                 * Creates a plain object from a GetPolicyOptions message. Also converts values to other types if specified.
                 * @param message GetPolicyOptions
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.iam.v1.GetPolicyOptions, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this GetPolicyOptions to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a Policy. */
            interface IPolicy {

                /** Policy version */
                version?: (number|null);

                /** Policy bindings */
                bindings?: (google.iam.v1.IBinding[]|null);

                /** Policy etag */
                etag?: (Uint8Array|string|null);
            }

            /** Represents a Policy. */
            class Policy implements IPolicy {

                /**
                 * Constructs a new Policy.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.iam.v1.IPolicy);

                /** Policy version. */
                public version: number;

                /** Policy bindings. */
                public bindings: google.iam.v1.IBinding[];

                /** Policy etag. */
                public etag: (Uint8Array|string);

                /**
                 * Creates a new Policy instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns Policy instance
                 */
                public static create(properties?: google.iam.v1.IPolicy): google.iam.v1.Policy;

                /**
                 * Encodes the specified Policy message. Does not implicitly {@link google.iam.v1.Policy.verify|verify} messages.
                 * @param message Policy message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.iam.v1.IPolicy, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified Policy message, length delimited. Does not implicitly {@link google.iam.v1.Policy.verify|verify} messages.
                 * @param message Policy message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.iam.v1.IPolicy, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a Policy message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns Policy
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.iam.v1.Policy;

                /**
                 * Decodes a Policy message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns Policy
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.iam.v1.Policy;

                /**
                 * Verifies a Policy message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a Policy message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns Policy
                 */
                public static fromObject(object: { [k: string]: any }): google.iam.v1.Policy;

                /**
                 * Creates a plain object from a Policy message. Also converts values to other types if specified.
                 * @param message Policy
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.iam.v1.Policy, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this Policy to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a Binding. */
            interface IBinding {

                /** Binding role */
                role?: (string|null);

                /** Binding members */
                members?: (string[]|null);

                /** Binding condition */
                condition?: (google.type.IExpr|null);
            }

            /** Represents a Binding. */
            class Binding implements IBinding {

                /**
                 * Constructs a new Binding.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.iam.v1.IBinding);

                /** Binding role. */
                public role: string;

                /** Binding members. */
                public members: string[];

                /** Binding condition. */
                public condition?: (google.type.IExpr|null);

                /**
                 * Creates a new Binding instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns Binding instance
                 */
                public static create(properties?: google.iam.v1.IBinding): google.iam.v1.Binding;

                /**
                 * Encodes the specified Binding message. Does not implicitly {@link google.iam.v1.Binding.verify|verify} messages.
                 * @param message Binding message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.iam.v1.IBinding, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified Binding message, length delimited. Does not implicitly {@link google.iam.v1.Binding.verify|verify} messages.
                 * @param message Binding message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.iam.v1.IBinding, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a Binding message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns Binding
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.iam.v1.Binding;

                /**
                 * Decodes a Binding message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns Binding
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.iam.v1.Binding;

                /**
                 * Verifies a Binding message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a Binding message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns Binding
                 */
                public static fromObject(object: { [k: string]: any }): google.iam.v1.Binding;

                /**
                 * Creates a plain object from a Binding message. Also converts values to other types if specified.
                 * @param message Binding
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.iam.v1.Binding, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this Binding to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a PolicyDelta. */
            interface IPolicyDelta {

                /** PolicyDelta bindingDeltas */
                bindingDeltas?: (google.iam.v1.IBindingDelta[]|null);

                /** PolicyDelta auditConfigDeltas */
                auditConfigDeltas?: (google.iam.v1.IAuditConfigDelta[]|null);
            }

            /** Represents a PolicyDelta. */
            class PolicyDelta implements IPolicyDelta {

                /**
                 * Constructs a new PolicyDelta.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.iam.v1.IPolicyDelta);

                /** PolicyDelta bindingDeltas. */
                public bindingDeltas: google.iam.v1.IBindingDelta[];

                /** PolicyDelta auditConfigDeltas. */
                public auditConfigDeltas: google.iam.v1.IAuditConfigDelta[];

                /**
                 * Creates a new PolicyDelta instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns PolicyDelta instance
                 */
                public static create(properties?: google.iam.v1.IPolicyDelta): google.iam.v1.PolicyDelta;

                /**
                 * Encodes the specified PolicyDelta message. Does not implicitly {@link google.iam.v1.PolicyDelta.verify|verify} messages.
                 * @param message PolicyDelta message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.iam.v1.IPolicyDelta, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified PolicyDelta message, length delimited. Does not implicitly {@link google.iam.v1.PolicyDelta.verify|verify} messages.
                 * @param message PolicyDelta message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.iam.v1.IPolicyDelta, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a PolicyDelta message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns PolicyDelta
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.iam.v1.PolicyDelta;

                /**
                 * Decodes a PolicyDelta message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns PolicyDelta
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.iam.v1.PolicyDelta;

                /**
                 * Verifies a PolicyDelta message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a PolicyDelta message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns PolicyDelta
                 */
                public static fromObject(object: { [k: string]: any }): google.iam.v1.PolicyDelta;

                /**
                 * Creates a plain object from a PolicyDelta message. Also converts values to other types if specified.
                 * @param message PolicyDelta
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.iam.v1.PolicyDelta, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this PolicyDelta to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            /** Properties of a BindingDelta. */
            interface IBindingDelta {

                /** BindingDelta action */
                action?: (google.iam.v1.BindingDelta.Action|keyof typeof google.iam.v1.BindingDelta.Action|null);

                /** BindingDelta role */
                role?: (string|null);

                /** BindingDelta member */
                member?: (string|null);

                /** BindingDelta condition */
                condition?: (google.type.IExpr|null);
            }

            /** Represents a BindingDelta. */
            class BindingDelta implements IBindingDelta {

                /**
                 * Constructs a new BindingDelta.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.iam.v1.IBindingDelta);

                /** BindingDelta action. */
                public action: (google.iam.v1.BindingDelta.Action|keyof typeof google.iam.v1.BindingDelta.Action);

                /** BindingDelta role. */
                public role: string;

                /** BindingDelta member. */
                public member: string;

                /** BindingDelta condition. */
                public condition?: (google.type.IExpr|null);

                /**
                 * Creates a new BindingDelta instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns BindingDelta instance
                 */
                public static create(properties?: google.iam.v1.IBindingDelta): google.iam.v1.BindingDelta;

                /**
                 * Encodes the specified BindingDelta message. Does not implicitly {@link google.iam.v1.BindingDelta.verify|verify} messages.
                 * @param message BindingDelta message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.iam.v1.IBindingDelta, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified BindingDelta message, length delimited. Does not implicitly {@link google.iam.v1.BindingDelta.verify|verify} messages.
                 * @param message BindingDelta message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.iam.v1.IBindingDelta, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes a BindingDelta message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns BindingDelta
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.iam.v1.BindingDelta;

                /**
                 * Decodes a BindingDelta message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns BindingDelta
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.iam.v1.BindingDelta;

                /**
                 * Verifies a BindingDelta message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates a BindingDelta message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns BindingDelta
                 */
                public static fromObject(object: { [k: string]: any }): google.iam.v1.BindingDelta;

                /**
                 * Creates a plain object from a BindingDelta message. Also converts values to other types if specified.
                 * @param message BindingDelta
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.iam.v1.BindingDelta, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this BindingDelta to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            namespace BindingDelta {

                /** Action enum. */
                enum Action {
                    ACTION_UNSPECIFIED = 0,
                    ADD = 1,
                    REMOVE = 2
                }
            }

            /** Properties of an AuditConfigDelta. */
            interface IAuditConfigDelta {

                /** AuditConfigDelta action */
                action?: (google.iam.v1.AuditConfigDelta.Action|keyof typeof google.iam.v1.AuditConfigDelta.Action|null);

                /** AuditConfigDelta service */
                service?: (string|null);

                /** AuditConfigDelta exemptedMember */
                exemptedMember?: (string|null);

                /** AuditConfigDelta logType */
                logType?: (string|null);
            }

            /** Represents an AuditConfigDelta. */
            class AuditConfigDelta implements IAuditConfigDelta {

                /**
                 * Constructs a new AuditConfigDelta.
                 * @param [properties] Properties to set
                 */
                constructor(properties?: google.iam.v1.IAuditConfigDelta);

                /** AuditConfigDelta action. */
                public action: (google.iam.v1.AuditConfigDelta.Action|keyof typeof google.iam.v1.AuditConfigDelta.Action);

                /** AuditConfigDelta service. */
                public service: string;

                /** AuditConfigDelta exemptedMember. */
                public exemptedMember: string;

                /** AuditConfigDelta logType. */
                public logType: string;

                /**
                 * Creates a new AuditConfigDelta instance using the specified properties.
                 * @param [properties] Properties to set
                 * @returns AuditConfigDelta instance
                 */
                public static create(properties?: google.iam.v1.IAuditConfigDelta): google.iam.v1.AuditConfigDelta;

                /**
                 * Encodes the specified AuditConfigDelta message. Does not implicitly {@link google.iam.v1.AuditConfigDelta.verify|verify} messages.
                 * @param message AuditConfigDelta message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encode(message: google.iam.v1.IAuditConfigDelta, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Encodes the specified AuditConfigDelta message, length delimited. Does not implicitly {@link google.iam.v1.AuditConfigDelta.verify|verify} messages.
                 * @param message AuditConfigDelta message or plain object to encode
                 * @param [writer] Writer to encode to
                 * @returns Writer
                 */
                public static encodeDelimited(message: google.iam.v1.IAuditConfigDelta, writer?: $protobuf.Writer): $protobuf.Writer;

                /**
                 * Decodes an AuditConfigDelta message from the specified reader or buffer.
                 * @param reader Reader or buffer to decode from
                 * @param [length] Message length if known beforehand
                 * @returns AuditConfigDelta
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.iam.v1.AuditConfigDelta;

                /**
                 * Decodes an AuditConfigDelta message from the specified reader or buffer, length delimited.
                 * @param reader Reader or buffer to decode from
                 * @returns AuditConfigDelta
                 * @throws {Error} If the payload is not a reader or valid buffer
                 * @throws {$protobuf.util.ProtocolError} If required fields are missing
                 */
                public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.iam.v1.AuditConfigDelta;

                /**
                 * Verifies an AuditConfigDelta message.
                 * @param message Plain object to verify
                 * @returns `null` if valid, otherwise the reason why it is not
                 */
                public static verify(message: { [k: string]: any }): (string|null);

                /**
                 * Creates an AuditConfigDelta message from a plain object. Also converts values to their respective internal types.
                 * @param object Plain object
                 * @returns AuditConfigDelta
                 */
                public static fromObject(object: { [k: string]: any }): google.iam.v1.AuditConfigDelta;

                /**
                 * Creates a plain object from an AuditConfigDelta message. Also converts values to other types if specified.
                 * @param message AuditConfigDelta
                 * @param [options] Conversion options
                 * @returns Plain object
                 */
                public static toObject(message: google.iam.v1.AuditConfigDelta, options?: $protobuf.IConversionOptions): { [k: string]: any };

                /**
                 * Converts this AuditConfigDelta to JSON.
                 * @returns JSON object
                 */
                public toJSON(): { [k: string]: any };
            }

            namespace AuditConfigDelta {

                /** Action enum. */
                enum Action {
                    ACTION_UNSPECIFIED = 0,
                    ADD = 1,
                    REMOVE = 2
                }
            }
        }
    }

    /** Namespace type. */
    namespace type {

        /** Properties of an Expr. */
        interface IExpr {

            /** Expr expression */
            expression?: (string|null);

            /** Expr title */
            title?: (string|null);

            /** Expr description */
            description?: (string|null);

            /** Expr location */
            location?: (string|null);
        }

        /** Represents an Expr. */
        class Expr implements IExpr {

            /**
             * Constructs a new Expr.
             * @param [properties] Properties to set
             */
            constructor(properties?: google.type.IExpr);

            /** Expr expression. */
            public expression: string;

            /** Expr title. */
            public title: string;

            /** Expr description. */
            public description: string;

            /** Expr location. */
            public location: string;

            /**
             * Creates a new Expr instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Expr instance
             */
            public static create(properties?: google.type.IExpr): google.type.Expr;

            /**
             * Encodes the specified Expr message. Does not implicitly {@link google.type.Expr.verify|verify} messages.
             * @param message Expr message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(message: google.type.IExpr, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Encodes the specified Expr message, length delimited. Does not implicitly {@link google.type.Expr.verify|verify} messages.
             * @param message Expr message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(message: google.type.IExpr, writer?: $protobuf.Writer): $protobuf.Writer;

            /**
             * Decodes an Expr message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Expr
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): google.type.Expr;

            /**
             * Decodes an Expr message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Expr
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): google.type.Expr;

            /**
             * Verifies an Expr message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): (string|null);

            /**
             * Creates an Expr message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Expr
             */
            public static fromObject(object: { [k: string]: any }): google.type.Expr;

            /**
             * Creates a plain object from an Expr message. Also converts values to other types if specified.
             * @param message Expr
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(message: google.type.Expr, options?: $protobuf.IConversionOptions): { [k: string]: any };

            /**
             * Converts this Expr to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };
        }
    }
}
