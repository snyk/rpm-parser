# RPM Parser Tests #

The RPM parser tests use fixtures and output obtained from RPM-based images in order to compare its output to that of `rpm`.

## Running tests ##

```sh
npm test
```

## Creating or updating fixtures ##

Fixtures are created by running a container image, installing packages, and then obtaining the RPM database file as well as some formatted output from `rpm`.

```sh
# Start a shell into the RPM-based image.
docker run -it <image:tag> sh

# Install packages using your preferred package manager.
yum groupinstall -y "Development tools"

# Use RPM to produce a list of expected outputs.
# Put the output in a file under outputs/<OutputName>.
rpm -qa --queryformat "%{NAME}\t%{EPOCH}:%{VERSION}-%{RELEASE}\t%{SIZE}\n" | sed "s/(none)://g" | sed "s/0://g"

# In a separate shell copy the RPM database file into fixtures/.
# Make sure the file is named similarly to the one under outputs/.
docker ps # find the container ID
docker cp <container ID>:/var/lib/rpm/Packages ./fixtures/<FixtureName>
```

Finally, update `test/index.test.ts` to include the new fixture in the tests.
