# ssm-native.github.io

This is the source code for the website of SSM Native from the [Software Technology Group](https://www.stg.tu-darmstadt.de) at Technische Universität Darmstadt

## Run Locally

Start a local web server from the project root:

```powershell
python -m http.server 5500
```

Then open [http://localhost:5500](http://localhost:5500).

## Publications from BibTeX

The Publications section is generated from `publications.bib`.

- Add, edit, or remove entries in `publications.bib`.
- Reload the website to see updates.
- Use a local server (see above), since the site fetches the BibTeX file.

Supported BibTeX fields:

- `title`
- `author` (use `and` between authors)
- `year`
- `booktitle` or `journal`
- `abstract`
- `keywords` (comma or semicolon separated)
- `url` (or `doi`)

Template:

```bibtex
@inproceedings{key2026example,
  title = {Paper Title},
  author = {Last, First and Last, First},
  year = {2026},
  booktitle = {Conference Name},
  abstract = {One-sentence summary of the paper.},
  keywords = {Topic A, Topic B, Topic C},
  url = {https://example.org/paper}
}
```

## Acknowledgements

This website's template is adapted from the [Nerfies](https://nerfies.github.io/) website.
