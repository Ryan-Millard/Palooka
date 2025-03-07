#ifndef FILESYSTEM_H
#define FILESYSTEM_H

#include <LittleFS.h>

namespace FileSystem
{
	class FSManager
	{
		public:
			static bool begin(const bool FORMAT_ON_FAIL = false);
			static File getFile(const char* path);
	};
}

#endif
