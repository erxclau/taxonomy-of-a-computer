# taxonomy-of-a-computer

1. To generate taxonomical data, pipe output of the disk usage command at the root of your computer into a text file like so:

   ```bash
   cd ~
   du -a . > files.txt
   ```

2. From there, you'll want to slightly modify the text file into a CSV file by replacing white space with commas and adding a `size` and `path` header. Rename your `files.txt` file to `files.csv`.
   - You'll likely want to replace `(^\d+)\s+` with `$1,"` and `\n` with `"\n`.
3. Then, install dependencies by running `yarn`.
4. Run the parsing script by running `node parse.js`. This will create a file called `hierarchy.json` which will be used to create a taxonomy.
   - `parse.js` will take some time to run, dependent on how much disk space you use. For reference, with a 144MB `files.csv`, the script takes around a minute to run.

Start the development server by running `yarn vite`.
