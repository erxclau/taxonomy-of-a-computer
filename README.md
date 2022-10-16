# taxonomy-of-a-computer

1. To generate taxonomical data, pipe output of the disk usage command at the root of your computer into a text file like so:

   ```bash
   cd ~
   du . > sizes.txt
   ```

2. From there, you'll want to slightly modify the text file into a CSV file by replacing white space with commas and adding a `size` and `path` header. Rename your `sizes.txt` file to `sizes.csv`.
3. Then, install dependencies by running `yarn`.
4. Run the parsing script by running `node parse.js`. This will create a file called `hierarchy.json` which will be used to create a taxonomy.
   - `parse.js` will take some time to run, dependent on how much disk space you use. For reference, with a 21MB `sizes.csv`, the script takes around 9 to 10 seconds to run.
