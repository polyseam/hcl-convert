import { cyan, red } from "@std/fmt/colors";
import { join as joinPath } from "@std/path";
import { Command } from "@cliffy/command";
import { parse as parseHCL } from "@cdktf/hcl2json";
import { stringify as yamlStringify } from "@std/yaml";
import deno_json from "./deno.json" with { type: "json" };

export default async function hclConvert() {
  const hclConvertVersion = `${deno_json?.version}`;

  const hclConvertCommand = await new Command()
    .version(`v${hclConvertVersion}`)
    .name("hcl-convert")
    .arguments("<input:string> <output:string>")
    .option("-q,--quiet", "suppress output")
    .description("HCL to whatever")
    .parse(Deno.args);

  if (hclConvertCommand.options.quiet) {
    console.log = () => {};
    console.error = () => {};
  }

  const input = hclConvertCommand.args[0];
  const output = hclConvertCommand.args[1];

  if (!input || !output) {
    console.error("Usage: hcl-convert <input> <output>");
    Deno.exit(1);
  }

  const srcPath = joinPath(Deno.cwd(), input);

  let srcFileContents = "";

  try {
    srcFileContents = await Deno.readTextFile(srcPath);
  } catch (e) {
    console.error(red(`Error reading file:`), srcPath);
    console.error(e);
    Deno.exit(1);
  }

  let obj = {};

  console.log(cyan(`Parsing HCL file:`), srcPath);

  try {
    obj = await parseHCL(input, srcFileContents);
    console.log(cyan(`Parsed HCL file`), input);
  } catch (e) {
    console.error(red(`Error parsing HCL file:`), srcPath);
    console.error(e);
    Deno.exit(1);
  }

  if (output.endsWith(".json") || output.endsWith(".jsonc")) {
    try {
      await Deno.writeTextFile(output, JSON.stringify(obj, null, 2));
      Deno.exit(0);
    } catch (e) {
      console.error(cyan(`Error writing JSON file: ${output}`));
      console.error(e);
      Deno.exit(1);
    }
  }

  if (output.endsWith(".yml") || output.endsWith(".yaml")) {
    let yaml = "";

    try {
      yaml = yamlStringify(obj);
    } catch (e) {
      console.error(cyan(`Error converting JSON to YAML: ${output}`));
      console.error(e);
      Deno.exit(1);
    }

    try {
      await Deno.writeTextFile(output, yaml);
      Deno.exit(0);
    } catch (e) {
      console.error(cyan(`Error writing YAML file: ${output}`));
      console.error(e);
      Deno.exit(1);
    }
  } else {
    console.error(
      red(`Unsupported output file type:`),
      output.split(".").pop(),
    );
    Deno.exit(1);
  }
}

// Learn more at https://deno.land/manual/examples/module_metadata#concepts
if (import.meta.main) {
  await hclConvert();
}
