# zkless-engine
Compile ZK Themes using the [lesscss compiler](http://lesscss.org/).


## Install / Run

Requires node >=10.16

### Use globally

    npm install zkless-engine -g
    zklessc [params]
    
### Use locally (add to package.json)

    npm install zkless-engine --save-dev
    npx zklessc [params]

### Available parameters

| param           | description                                     | default/value           |
| --------------- | ----------------------------------------------- | ----------------------- |
| `-s/--source`   | source folder to compile/watch                  | src/main/resources/web  |
| `-o/--output`   | output folder for .css.dsp files                | target/classes/web      |
| `-w/--watch`    | watch files after successful compile            | false (optional)        |
| `-c/--compress` | watch files after successful compile            | false (optional)        |
| `-i/--imports`  | specify multiple folders for @import resolution | - (optional/multiple)   |
| `--less-opts`   | json string with custom [less options](http://lesscss.org/usage/#less-options)  | {}                      |

## Examples

### Basic

Compile a custom zktheme cloned from [zk theme template project](https://github.com/zkoss/zkThemeTemplate):

(1) long params, (2) shortcut params and watch, (3) and compress

```
    zklessc --source src/archive/web --output target/classes/web/mytheme
    zklessc -s src/archive/web -o target/classes/web/mytheme -w
    zklessc -s src/archive/web -o target/classes/web/mytheme -cw
```

### Include external folders into build 

See [less include paths](http://lesscss.org/usage/#less-options-include-paths)

Assume the folder structure:
```
root
- mytheme 
  - src/archive/web/js/zul/wgt/button/less
    - button.less
    - _mybutton.less
- 3rdparty
  - amazingtool
    - shapes.less
- styleguide
  - corporatecolors.less
```

By executing the command ...

    zklessc -s src/archive/web -o target/classes/web/mytheme -i ../3rdparty -i ../styleguide

... less will find @imports based on those folders as well

button.less
```less
@import "/zul/less/_header.less"; /*absolute import based on source directory (-s)*/
/*omitted zk styles*/
/*your imports*/
@import "_mybutton.less"; /*relative import*/
```

_mybutton.less
```less
@import "/amazingtool/shapes.less" /*will be found below "-i ../3rdparty"*/
@import "/corporatecolors.less" /*will be found below "-i ../styleguide"*/
/*my styles*/

.z-button {
    color: @corporateGreen; /* using a variable from corporatecolors.less */
    .amazing-shape-rounded(10px);
}
```

### Maven integration

Since zklessc is a plain command line tool it can be integrated into a maven build using the standard [exec-maven-plugin](https://www.mojohaus.org/exec-maven-plugin/index.html).

e.g. run `zklessc` during the [process-resources phase](https://maven.apache.org/guides/introduction/introduction-to-the-lifecycle):

```xml
...
<build>
  <resources>
    <!-- handle class web resources separately below -->
    <resource>
      <directory>${project.basedir}/src/archive</directory>
      <excludes>
        <exclude>web/**</exclude>
      </excludes>
    </resource>
    <!-- copy non-less into theme folder (here artifactId == theme name), 
    less files will be handled by plugin below -->
    <resource>
      <directory>${project.basedir}/src/archive/web</directory>
      <excludes>
        <exclude>**/*.less</exclude>
      </excludes>
      <targetPath>${project.build.outputDirectory}/web/${project.artifactId}</targetPath>
    </resource>
  </resources>
  <plugins>
    ...
    <plugin>
      <groupId>org.codehaus.mojo</groupId>
      <artifactId>exec-maven-plugin</artifactId>
      <version>1.6</version>
      <executions>
        <execution>
          <id>compile-less</id>
          <phase>process-resources</phase>
          <goals>
            <goal>exec</goal>
          </goals>
        </execution>
      </executions>
      <configuration>
        <executable>zklessc</executable>
        <arguments>
          <argument>--source</argument>
          <argument>${project.basedir}/src/archive</argument>
          <argument>--output</argument>
          <argument>${project.build.outputDirectory}/web/${project.artifactId}</argument>
          <argument>--compress</argument>
        </arguments>
      </configuration>
    </plugin>
    ...
```

Then execute directly via:

    mvn process-recources

or build the project normally

    mvn clean package

### Gradle usage

call the same command from an [Exec](https://docs.gradle.org/current/dsl/org.gradle.api.tasks.Exec.html)-task



