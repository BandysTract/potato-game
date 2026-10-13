# Instrument sample sources

The WAV files in this folder are original, unmodified VSCO 2 Community Edition recordings published by Versilian Studios. Recorded by Sam Gossner and Simon Dalzell. Sample cutting by Elan Hickler / Soundemote.

- [Official library page](https://versilian-studios.com/vsco-community/) links its “Original .wav format” download to [sgossner/VSCO-2-CE](https://github.com/sgossner/VSCO-2-CE).
- Source WAV commit: `440300901dfe9275fd84e0b7763af1f8443ae62e`.
- [Upstream license](https://github.com/sgossner/VSCO-2-CE/blob/440300901dfe9275fd84e0b7763af1f8443ae62e/LICENSE): CC0 1.0 Universal. The complete upstream license text follows below.
- Each sample’s exact source URL, original filename, SHA-256 checksum, upstream Git blob checksum, WAV properties, and MIDI root appear in `manifest.json`.
- Pitches and tuning corrections come from the original [SFZ instrument maps](https://github.com/sgossner/VSCO-2-CE/tree/6dd651d55dde97fd4028699be9d4481f26917891) at commit `6dd651d55dde97fd4028699be9d4481f26917891`. MIDI is a note-number system used by music software. MIDI note 60 is C4. Clarinet and contrabass source filenames use octave numbers one lower than their mapped MIDI pitches. Use `rootMidi`, not the octave in `originalPath`. `tuneCents` records the official pitch correction, including −20 cents for the soft C4 violin sample.
- The selected violin recordings are the soft `p` layer. Clarinet and bass use `v1`, the lowest available selected velocity layer. The tambourine recording is a single upstroke from the included VSCO 1 percussion folder. Its filename does not document a quiet dynamic, so playback volume must set its level.
- The subset contains four solo violin sustain samples, four clarinet sustain samples, two solo contrabass pizzicato samples, and one tambourine hit. Nearest clarinet pitches for C4, G4, C5, and G5 are B♭3, F4, B♭4, and F5. Bass roots are C2 and F♯2. Where two roots are equally close, the lower root is chosen.
- No full library archive, third-party arrangement, paid recording, or package installation was used. The raw repository tree contained no filename matching “woodblock,” “wood block,” or “woodbloc.”

## Upstream CC0 license text

The following block reproduces the upstream `LICENSE` file verbatim.

```text
CC0 1.0 Universal

Statement of Purpose

The laws of most jurisdictions throughout the world automatically confer
exclusive Copyright and Related Rights (defined below) upon the creator and
subsequent owner(s) (each and all, an "owner") of an original work of
authorship and/or a database (each, a "Work").

Certain owners wish to permanently relinquish those rights to a Work for the
purpose of contributing to a commons of creative, cultural and scientific
works ("Commons") that the public can reliably and without fear of later
claims of infringement build upon, modify, incorporate in other works, reuse
and redistribute as freely as possible in any form whatsoever and for any
purposes, including without limitation commercial purposes. These owners may
contribute to the Commons to promote the ideal of a free culture and the
further production of creative, cultural and scientific works, or to gain
reputation or greater distribution for their Work in part through the use and
efforts of others.

For these and/or other purposes and motivations, and without any expectation
of additional consideration or compensation, the person associating CC0 with a
Work (the "Affirmer"), to the extent that he or she is an owner of Copyright
and Related Rights in the Work, voluntarily elects to apply CC0 to the Work
and publicly distribute the Work under its terms, with knowledge of his or her
Copyright and Related Rights in the Work and the meaning and intended legal
effect of CC0 on those rights.

1. Copyright and Related Rights. A Work made available under CC0 may be
protected by copyright and related or neighboring rights ("Copyright and
Related Rights"). Copyright and Related Rights include, but are not limited
to, the following:

  i. the right to reproduce, adapt, distribute, perform, display, communicate,
  and translate a Work;

  ii. moral rights retained by the original author(s) and/or performer(s);

  iii. publicity and privacy rights pertaining to a person's image or likeness
  depicted in a Work;

  iv. rights protecting against unfair competition in regards to a Work,
  subject to the limitations in paragraph 4(a), below;

  v. rights protecting the extraction, dissemination, use and reuse of data in
  a Work;

  vi. database rights (such as those arising under Directive 96/9/EC of the
  European Parliament and of the Council of 11 March 1996 on the legal
  protection of databases, and under any national implementation thereof,
  including any amended or successor version of such directive); and

  vii. other similar, equivalent or corresponding rights throughout the world
  based on applicable law or treaty, and any national implementations thereof.

2. Waiver. To the greatest extent permitted by, but not in contravention of,
applicable law, Affirmer hereby overtly, fully, permanently, irrevocably and
unconditionally waives, abandons, and surrenders all of Affirmer's Copyright
and Related Rights and associated claims and causes of action, whether now
known or unknown (including existing as well as future claims and causes of
action), in the Work (i) in all territories worldwide, (ii) for the maximum
duration provided by applicable law or treaty (including future time
extensions), (iii) in any current or future medium and for any number of
copies, and (iv) for any purpose whatsoever, including without limitation
commercial, advertising or promotional purposes (the "Waiver"). Affirmer makes
the Waiver for the benefit of each member of the public at large and to the
detriment of Affirmer's heirs and successors, fully intending that such Waiver
shall not be subject to revocation, rescission, cancellation, termination, or
any other legal or equitable action to disrupt the quiet enjoyment of the Work
by the public as contemplated by Affirmer's express Statement of Purpose.

3. Public License Fallback. Should any part of the Waiver for any reason be
judged legally invalid or ineffective under applicable law, then the Waiver
shall be preserved to the maximum extent permitted taking into account
Affirmer's express Statement of Purpose. In addition, to the extent the Waiver
is so judged Affirmer hereby grants to each affected person a royalty-free,
non transferable, non sublicensable, non exclusive, irrevocable and
unconditional license to exercise Affirmer's Copyright and Related Rights in
the Work (i) in all territories worldwide, (ii) for the maximum duration
provided by applicable law or treaty (including future time extensions), (iii)
in any current or future medium and for any number of copies, and (iv) for any
purpose whatsoever, including without limitation commercial, advertising or
promotional purposes (the "License"). The License shall be deemed effective as
of the date CC0 was applied by Affirmer to the Work. Should any part of the
License for any reason be judged legally invalid or ineffective under
applicable law, such partial invalidity or ineffectiveness shall not
invalidate the remainder of the License, and in such case Affirmer hereby
affirms that he or she will not (i) exercise any of his or her remaining
Copyright and Related Rights in the Work or (ii) assert any associated claims
and causes of action with respect to the Work, in either case contrary to
Affirmer's express Statement of Purpose.

4. Limitations and Disclaimers.

  a. No trademark or patent rights held by Affirmer are waived, abandoned,
  surrendered, licensed or otherwise affected by this document.

  b. Affirmer offers the Work as-is and makes no representations or warranties
  of any kind concerning the Work, express, implied, statutory or otherwise,
  including without limitation warranties of title, merchantability, fitness
  for a particular purpose, non infringement, or the absence of latent or
  other defects, accuracy, or the present or absence of errors, whether or not
  discoverable, all to the greatest extent permissible under applicable law.

  c. Affirmer disclaims responsibility for clearing rights of other persons
  that may apply to the Work or any use thereof, including without limitation
  any person's Copyright and Related Rights in the Work. Further, Affirmer
  disclaims responsibility for obtaining any necessary consents, permissions
  or other rights required for any use of the Work.

  d. Affirmer understands and acknowledges that Creative Commons is not a
  party to this document and has no duty or obligation with respect to this
  CC0 or use of the Work.

For more information, please see
<http://creativecommons.org/publicdomain/zero/1.0/>

```

## Traditional melodies and original arrangements

The game transcribes traditional melody lines and supplies new accompaniment,
tempos, instrumentation, and voicing. It does not copy a commercial recording,
lyrics, or a publisher’s score layout. The source PDFs are reference material,
not bundled assets. No reuse license was found for the modern teaching PDFs.

- Ach synku, synku: [Czech Radio context](https://cesky.radio.cz/prezidentska-hudba-8772366),
  [Erben 1862, no. 12](https://badatelska.pisnovna.cz/pisen/EN-0012/erben-karel-jaromir-ach-synku-synku-doma-li-jsi),
  and [modern melody reference](https://www.harmonika.cz/wp-content/uploads/2017/04/ach-synku-synku.pdf).
  Fourteen measures in 3/4. The game uses the familiar quarter-note tonic plus
  two beats of rest at the ends of phrases. The historic source has a different
  final-note duration.
- Já do lesa nepojedu: [Czech Television context](https://www.ceskatelevize.cz/porady/878948-zpivanky/297356165740015/),
  [Erben 1862, no. 150](https://badatelska.pisnovna.cz/pisen/EN-0150/erben-karel-jaromir-ja-do-lesa-nepojedu),
  and [modern melody reference](https://www.pavelhokr.cz/soubory/noty/Ja%20do%20lesa%20nepojedu.pdf).
  Sixteen measures in 3/4.
- Prší, prší: [Czech Television context](https://www.ceskatelevize.cz/porady/878948-zpivanky/297356165740028/)
  and [familiar melody reference](https://www.pavelhokr.cz/soubory/noty/Prsi%20prsi.pdf).
  The reference groups four quarter notes per printed bar without a meter sign.
  The game halves those values for 2/4. Opening pitches are G G A G, not E E F E.
  The similarly named Holas archive song is a different melody and is not used.

None of the chosen melody variants has a pickup. The arrangement engine uses
actual measure lengths and can represent a short pickup without padding it.
Hana hums each tune’s opening four-bar phrase, with a clarinet call before her
answer when learning. Notes and timing are shared with the background score.
Czech-listener identification is a separate acceptance check, not established
by transcription or automated playback checks.

The manifest lists all 11 bundled samples.
